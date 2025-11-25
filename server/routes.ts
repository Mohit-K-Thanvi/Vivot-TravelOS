import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateTripItinerary, adaptItinerary, generatePivotProposal } from "./gemini-service";
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
      headers: { 'User-Agent': 'VivotTravelOS/1.0' }
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

  // User Preferences
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

  // Trips
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
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // Self-healing: Fix missing coordinates
      const tripCoords = trip.coordinates as any;
      if (!tripCoords || (tripCoords.lat === 0 && tripCoords.lng === 0)) {
        const coords = await getCoordinates(trip.destination);
        if (coords) {
          const updated = await storage.updateTrip(trip.id, { coordinates: coords });
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
      const validatedData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip({
        ...validatedData,
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

  // Activities
  app.get("/api/trips/:id/activities", async (req, res) => {
    try {
      const activities = await storage.getActivitiesByTrip(req.params.id);

      // Self-healing: Fix missing coordinates
      const trip = await storage.getTrip(req.params.id);
      if (trip) {
        for (const activity of activities) {
          const actCoords = activity.coordinates as any;
          if (!actCoords || (actCoords.lat === 0 && actCoords.lng === 0)) {
            const query = `${activity.location}, ${trip.destination}`;
            const coords = await getCoordinates(query);
            if (coords) {
              await storage.updateActivity(activity.id, { coordinates: coords });
              activity.coordinates = coords; // Update in memory for response
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
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const updated = await storage.updateActivity(req.params.id, req.body);

      // If 'completed' status changed, update trip budget
      if (req.body.completed !== undefined && req.body.completed !== activity.completed) {
        const trip = await storage.getTrip(activity.tripId);
        if (trip) {
          let newSpent = trip.spent;
          if (req.body.completed) {
            newSpent += activity.cost;
          } else {
            newSpent -= activity.cost;
          }
          // Ensure spent doesn't go below 0
          newSpent = Math.max(0, newSpent);
          await storage.updateTripSpent(trip.id, newSpent);
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update activity" });
    }
  });

  // Budget
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
      const validatedData = insertBudgetItemSchema.parse(req.body);
      const item = await storage.createBudgetItem(validatedData);

      const budgetItems = await storage.getBudgetItemsByTrip(validatedData.tripId);
      const totalSpent = budgetItems.reduce((sum, b) => sum + b.amount, 0);
      await storage.updateTripSpent(validatedData.tripId, totalSpent);

      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid budget item data" });
    }
  });

  // Discoveries
  app.get("/api/discoveries", async (req, res) => {
    try {
      const discoveries = await storage.getAllDiscoveries();
      res.json(discoveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discoveries" });
    }
  });

  app.get("/api/discoveries/featured", async (req, res) => {
    try {
      const discoveries = await storage.getFeaturedDiscoveries();
      res.json(discoveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured discoveries" });
    }
  });

  // Chat & AI
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { content } = req.body;

      // Save user message
      await storage.createChatMessage({
        role: "user",
        content,
      });

      // Get user preferences for personalization
      const preferences = await storage.getPreferences(DEFAULT_USER_ID);

      // Generate AI response
      const aiResponse = await generateTripItinerary(content, preferences || undefined);

      // Create trip if AI generated one
      let createdTrip;
      if (aiResponse.trip) {
        // Geocoding fallback for destination
        let destCoords = aiResponse.trip.coordinates;
        if (!destCoords || (destCoords.lat === 0 && destCoords.lng === 0)) {
          const fetched = await getCoordinates(aiResponse.trip.destination);
          if (fetched) destCoords = fetched;
        }

        createdTrip = await storage.createTrip({
          userId: DEFAULT_USER_ID,
          destination: aiResponse.trip.destination,
          coordinates: destCoords,
          startDate: aiResponse.trip.startDate,
          endDate: aiResponse.trip.endDate,
          budget: aiResponse.trip.budget,
        });

        // Create all activities for the trip
        for (const activity of aiResponse.trip.activities) {
          // Geocoding fallback for activity
          let actCoords = activity.coordinates;
          if (!actCoords || (actCoords.lat === 0 && actCoords.lng === 0)) {
            const query = `${activity.location}, ${aiResponse.trip.destination}`;
            const fetched = await getCoordinates(query);
            if (fetched) actCoords = fetched;
          }

          const mainActivity = await storage.createActivity({
            tripId: createdTrip.id,
            day: activity.day,
            title: activity.title,
            description: activity.description || "",
            category: activity.category,
            time: activity.time,
            duration: activity.duration || "",
            location: activity.location,
            coordinates: actCoords,
            imageKeyword: activity.imageKeyword,
            cost: activity.cost,
            orderIndex: activity.orderIndex,
            isShadowOption: false,
            energyLevelRequirement: "high", // Default to high for main activities
          });

          // If shadow option exists, save it
          if (activity.shadowOption) {
            await storage.createActivity({
              tripId: createdTrip.id,
              day: activity.day,
              title: activity.shadowOption.title,
              description: activity.shadowOption.description,
              category: activity.shadowOption.category,
              time: activity.shadowOption.time,
              duration: activity.shadowOption.duration,
              location: activity.shadowOption.location,
              coordinates: activity.shadowOption.coordinates,
              cost: activity.shadowOption.cost,
              orderIndex: activity.orderIndex,
              isShadowOption: true,
              parentActivityId: mainActivity.id,
              energyLevelRequirement: "low",
            });
          }
        }
      }

      // Save assistant message with trip reference
      const assistantMessage = await storage.createChatMessage({
        role: "assistant",
        content: aiResponse.response,
        tripId: createdTrip?.id || null,
      });

      res.json({
        message: assistantMessage,
        trip: createdTrip,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Mood Pivot Routes
  app.post("/api/trips/:id/mood", async (req, res) => {
    try {
      const validatedData = insertMoodReadingSchema.parse(req.body);
      const reading = await storage.createMoodReading({
        ...validatedData,
        userId: DEFAULT_USER_ID,
      });

      // Check threshold (simplified for single user demo, but logic stands for group)
      // In a real group app, we'd fetch all readings for this trip in the last hour
      const recentReadings = await storage.getMoodReadings(req.params.id);
      const lowEnergyCount = recentReadings.filter(r => r.energyLevel === 'low').length;
      const totalReadings = recentReadings.length;

      // If > 40% are low energy (or just the current user for this demo)
      const shouldPivot = validatedData.energyLevel === 'low';

      res.json({ reading, shouldPivot });
    } catch (error) {
      res.status(400).json({ error: "Invalid mood data" });
    }
  });

  app.post("/api/trips/:id/pivot", async (req, res) => {
    try {
      const { currentActivityId, location, time, budgetRemaining } = req.body;
      const currentActivity = await storage.getActivity(currentActivityId);

      if (!currentActivity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // Check if a shadow option already exists
      const shadowActivities = await storage.getShadowActivities(req.params.id);
      const prePlannedShadow = shadowActivities.find(a => a.parentActivityId === currentActivityId);

      if (prePlannedShadow) {
        return res.json({
          proposal: "We have a relaxed alternative ready for you!",
          newActivity: prePlannedShadow,
          isPrePlanned: true
        });
      }

      // If no shadow option, generate one on the fly
      const pivotProposal = await generatePivotProposal(currentActivity, {
        location,
        time,
        budgetRemaining,
        groupMood: "low"
      });

      res.json({
        ...pivotProposal,
        isPrePlanned: false
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate pivot" });
    }
  });

  app.post("/api/trips/:id/pivot/confirm", async (req, res) => {
    try {
      const { oldActivityId, newActivityData, reason } = req.body;

      // 1. Mark old activity as cancelled (or delete, or move to history)
      // For now, let's just update the old activity to be the new one
      // In a real app, we might want to keep the old one as "cancelled"

      const updatedActivity = await storage.updateActivity(oldActivityId, {
        title: newActivityData.title,
        description: newActivityData.description,
        category: newActivityData.category,
        location: newActivityData.location,
        cost: newActivityData.cost,
        duration: newActivityData.duration,
        energyLevelRequirement: "low",
        isShadowOption: false // It's now the main plan
      });

      // Log the pivot
      await storage.createPivotLog({
        tripId: req.params.id,
        triggeredBy: "user_consensus",
        previousActivityId: oldActivityId,
        newActivityId: updatedActivity.id,
        reason: reason || "Group energy low",
      });

      res.json(updatedActivity);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm pivot" });
    }
  });

  // Itinerary adaptation
  app.post("/api/trips/:id/adapt", async (req, res) => {
    try {
      const { context } = req.body;
      const activities = await storage.getActivitiesByTrip(req.params.id);

      const activitiesText = activities
        .map((a) => `${a.time} - ${a.title} at ${a.location}`)
        .join("\n");

      const suggestions = await adaptItinerary(activitiesText, context);

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
