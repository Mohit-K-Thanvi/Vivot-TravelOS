import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateTripItinerary, adaptItinerary } from "./gemini-service";
import {
  insertTripSchema,
  insertActivitySchema,
  insertBudgetItemSchema,
  insertUserPreferencesSchema,
  insertChatMessageSchema,
} from "@shared/schema";

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
      const activity = await storage.updateActivity(req.params.id, req.body);
      res.json(activity);
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
        createdTrip = await storage.createTrip({
          userId: DEFAULT_USER_ID,
          destination: aiResponse.trip.destination,
          startDate: aiResponse.trip.startDate,
          endDate: aiResponse.trip.endDate,
          budget: aiResponse.trip.budget,
        });

        // Create all activities for the trip
        for (const activity of aiResponse.trip.activities) {
          await storage.createActivity({
            tripId: createdTrip.id,
            day: activity.day,
            title: activity.title,
            description: activity.description || "",
            category: activity.category,
            time: activity.time,
            duration: activity.duration || "",
            location: activity.location,
            cost: activity.cost,
            orderIndex: activity.orderIndex,
          });
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
