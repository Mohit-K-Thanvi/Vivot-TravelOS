import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateTripItinerary, adaptItinerary, generatePivotProposal, generateCareModePlan } from "./gemini-service";
import {
  insertTripSchema,
  insertActivitySchema,
  insertBudgetItemSchema,
  insertUserPreferencesSchema,
  insertChatMessageSchema,
  insertMoodReadingSchema,
  insertPivotLogSchema,
} from "@shared/schema";

async function getCoordinates(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
      headers: { "User-Agent": "VivotTravelOS/1.0" },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // -----------------------------------------------------------------
  // USER PREFERENCES
  // -----------------------------------------------------------------
  app.get("/api/preferences", async (req, res) => {
    try {
      let prefs = await storage.getPreferences(DEFAULT_USER_ID);
      if (!prefs) {
        prefs = await storage.createPreferences({
          userId: DEFAULT_USER_ID,
          budget: "medium",
          pace: "moderate",
          interests: ["food", "culture"],
          dietary: ["none"],
          travelStyle: "solo",
        });
      }
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/preferences", async (req, res) => {
    try {
      const prefs = await storage.getPreferences(DEFAULT_USER_ID);
      if (!prefs) {
        const created = await storage.createPreferences({
          userId: DEFAULT_USER_ID,
          ...req.body,
        });
        return res.json(created);
      }
      const updated = await storage.updatePreferences(prefs.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // -----------------------------------------------------------------
  // TRIPS
  // -----------------------------------------------------------------
  app.get("/api/trips", async (req, res) => {
    try {
      const trips = await storage.getTripsByUser(DEFAULT_USER_ID);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      // Self‑healing coordinates
      const coords = trip.coordinates as any;
      if (!coords || (coords.lat === 0 && coords.lng === 0)) {
        const fetched = await getCoordinates(trip.destination);
        if (fetched) {
          const updated = await storage.updateTrip(trip.id, { coordinates: fetched });
          return res.json(updated);
        }
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      const validated = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip({
        ...validated,
        userId: DEFAULT_USER_ID,
      });
      res.json(trip);
    } catch (error) {
      res.status(400).json({ error: "Invalid trip data" });
    }
  });

  app.patch("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.updateTrip(req.params.id, req.body);
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip" });
    }
  });

  // -----------------------------------------------------------------
  // ACTIVITIES (including self‑healing coordinates)
  // -----------------------------------------------------------------
  app.get("/api/trips/:id/activities", async (req, res) => {
    try {
      const activities = await storage.getActivitiesByTrip(req.params.id);
      const trip = await storage.getTrip(req.params.id);
      if (trip) {
        for (const a of activities) {
          const actCoords = a.coordinates as any;
          if (!actCoords || (actCoords.lat === 0 && actCoords.lng === 0)) {
            const query = `${a.location}, ${trip.destination}`;
            const fetched = await getCoordinates(query);
            if (fetched) {
              await storage.updateActivity(a.id, { coordinates: fetched });
              a.coordinates = fetched; // reflect in response
            }
          }
        }
      }
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validated = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validated);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  // *** PATCH activity – budget tracking ***
  app.patch("/api/activities/:id", async (req, res) => {
    try {
      console.log(`[Activity PATCH] ID: ${req.params.id}`, req.body);
      const oldActivity = await storage.getActivity(req.params.id);
      if (!oldActivity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const activity = await storage.updateActivity(req.params.id, req.body);

      // Budget tracking when completion toggles
      if (
        req.body.completed !== undefined &&
        req.body.completed !== oldActivity.completed
      ) {
        const tripId = oldActivity.tripId;
        if (req.body.completed && !oldActivity.completed && activity.cost > 0) {
          // create budget item
          await storage.createBudgetItem({
            tripId,
            category: activity.category,
            description: activity.title,
            amount: activity.cost,
            date: new Date().toISOString().split("T")[0],
          });
        } else if (!req.body.completed && oldActivity.completed && activity.cost > 0) {
          // remove matching budget item
          const items = await storage.getBudgetItemsByTrip(tripId);
          const toRemove = items.find(
            (i) => i.description === activity.title && i.amount === activity.cost,
          );
          if (toRemove) await storage.deleteBudgetItem(toRemove.id);
        }
        // recalc spent
        const items = await storage.getBudgetItemsByTrip(tripId);
        const total = items.reduce((s, i) => s + i.amount, 0);
        await storage.updateTripSpent(tripId, total);
      }

      res.json(activity);
    } catch (error) {
      console.error("Activity update error:", error);
      res.status(500).json({ error: "Failed to update activity" });
    }
  });

  // -----------------------------------------------------------------
  // BUDGET ENDPOINTS
  // -----------------------------------------------------------------
  app.get("/api/trips/:id/budget", async (req, res) => {
    try {
      const items = await storage.getBudgetItemsByTrip(req.params.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget items" });
    }
  });

  app.post("/api/budget", async (req, res) => {
    try {
      const validated = insertBudgetItemSchema.parse(req.body);
      const item = await storage.createBudgetItem(validated);
      const items = await storage.getBudgetItemsByTrip(validated.tripId);
      const total = items.reduce((s, b) => s + b.amount, 0);
      await storage.updateTripSpent(validated.tripId, total);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid budget item data" });
    }
  });

  // -----------------------------------------------------------------
  // DISCOVERIES
  // -----------------------------------------------------------------
  app.get("/api/discoveries/featured", async (req, res) => {
    try {
      const discoveries = await storage.getFeaturedDiscoveries();
      res.json(discoveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured discoveries" });
    }
  });

  app.get("/api/discoveries", async (req, res) => {
    try {
      const discoveries = await storage.getAllDiscoveries();
      res.json(discoveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discoveries" });
    }
  });

  // -----------------------------------------------------------------
  // CHAT & AI PLANNING
  // -----------------------------------------------------------------
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { content } = req.body;

      // 1. Save User Message
      await storage.createChatMessage({
        role: "user",
        content,
        tripId: null, // Context could be added here
      });

      // 2. Generate AI Response
      const result = await generateTripItinerary(content);

      // 3. Save AI Response
      await storage.createChatMessage({
        role: "assistant",
        content: result.response,
        tripId: null,
      });

      // 4. If a trip was generated, save it to DB
      if (result.trip) {
        const trip = await storage.createTrip({
          destination: result.trip.destination,
          startDate: result.trip.startDate,
          endDate: result.trip.endDate,
          budget: result.trip.budget,
          coordinates: result.trip.coordinates,
          imageUrl: null,
          userId: DEFAULT_USER_ID,
        });

        // Save activities
        for (const act of result.trip.activities) {
          const activity = await storage.createActivity({
            tripId: trip.id,
            title: act.title,
            description: act.description,
            category: act.category,
            location: act.location,
            coordinates: act.coordinates,
            time: act.time,
            duration: act.duration,
            cost: act.cost,
            day: act.day,
            orderIndex: act.orderIndex,
            imageKeyword: act.imageKeyword,
            energyLevelRequirement: "high",
            isShadowOption: false,
            completed: false,
          });

          // Save shadow option if exists
          if (act.shadowOption) {
            await storage.createActivity({
              tripId: trip.id,
              title: act.shadowOption.title,
              description: act.shadowOption.description,
              category: act.shadowOption.category,
              location: act.shadowOption.location,
              coordinates: act.shadowOption.coordinates,
              time: act.shadowOption.time,
              duration: act.shadowOption.duration,
              cost: act.shadowOption.cost,
              day: act.day,
              orderIndex: act.orderIndex,
              imageKeyword: null,
              energyLevelRequirement: "low",
              isShadowOption: true,
              completed: false,
              parentActivityId: activity.id,
            });
          }
        }

        return res.json({ ...result, trip });
      }

      res.json(result);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  // -----------------------------------------------------------------
  // MOOD & PIVOT
  // -----------------------------------------------------------------
  app.post("/api/trips/:id/mood", async (req, res) => {
    try {
      const tripId = req.params.id;
      const { energyLevel } = req.body;

      await storage.createMoodReading({
        tripId,
        energyLevel,
        userId: DEFAULT_USER_ID,
      });

      // Simple pivot logic: if energy is low, trigger pivot suggestion
      const shouldPivot = energyLevel === "low";

      res.json({ success: true, shouldPivot });
    } catch (error) {
      res.status(500).json({ error: "Failed to record mood" });
    }
  });

  app.post("/api/trips/:id/pivot", async (req, res) => {
    try {
      const tripId = req.params.id;
      const { currentActivityId, location } = req.body;

      const activity = await storage.getActivity(currentActivityId);
      const trip = await storage.getTrip(tripId);

      if (!activity || !trip) {
        return res.status(404).json({ error: "Activity or Trip not found" });
      }

      const proposal = await generatePivotProposal(activity, {
        location: location || activity.location,
        time: new Date().toLocaleTimeString(),
        budgetRemaining: trip.budget - trip.spent,
        groupMood: "tired",
      });

      // Log the pivot
      await storage.createPivotLog({
        tripId,
        previousActivityId: activity.id,
        reason: "User requested pivot (Low Energy)",
        triggeredBy: ""
      });

      res.json(proposal);
    } catch (error) {
      console.error("Pivot error:", error);
      res.status(500).json({ error: "Failed to generate pivot" });
    }
  });

  app.post("/api/trips/:id/care-mode", async (req, res) => {
    try {
      const { condition, destination } = req.body;
      if (!condition || !destination) {
        return res.status(400).json({ error: "Condition and destination are required" });
      }

      const plan = await generateCareModePlan(condition, destination);
      res.json(plan);
    } catch (error) {
      console.error("Care Mode Error:", error);
      res.status(500).json({ error: "Failed to generate care plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
