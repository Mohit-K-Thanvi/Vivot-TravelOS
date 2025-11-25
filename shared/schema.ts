import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Preferences for AI learning
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default("default-user"),
  budget: varchar("budget").notNull(), // low, medium, high, luxury
  pace: varchar("pace").notNull(), // relaxed, moderate, fast-paced
  interests: text("interests").array().notNull(), // e.g., ["food", "adventure", "culture", "nature"]
  dietary: text("dietary").array().notNull(), // e.g., ["vegetarian", "vegan", "halal"]
  travelStyle: varchar("travel_style").notNull(), // solo, couple, family, group
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Trips
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default("default-user"),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  budget: real("budget").notNull(),
  spent: real("spent").default(0).notNull(),
  status: varchar("status").notNull().default("planning"), // planning, active, completed
  imageUrl: text("image_url"),
  coordinates: jsonb("coordinates"), // { lat: number, lng: number }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Itinerary Activities
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  day: integer("day").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // activity, restaurant, accommodation, transport
  time: text("time").notNull(),
  duration: text("duration"),
  location: text("location").notNull(),
  cost: real("cost").default(0).notNull(),
  imageUrl: text("image_url"),
  orderIndex: integer("order_index").notNull(),
  completed: boolean("completed").default(false).notNull(),
  isShadowOption: boolean("is_shadow_option").default(false).notNull(),
  parentActivityId: varchar("parent_activity_id"), // ID of the main activity this shadows
  energyLevelRequirement: varchar("energy_level_requirement").default("high"), // high, medium, low
  coordinates: jsonb("coordinates"), // { lat: number, lng: number }
  imageKeyword: text("image_keyword"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discovery Places
export const discoveries = pgTable("discoveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // hidden-gem, local-experience, popular, adventure
  location: text("location").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: real("rating").default(4.5).notNull(),
  sentiment: varchar("sentiment").notNull(), // highly-rated, hidden-gem, trending, local-favorite
  cost: varchar("cost").notNull(), // free, low, medium, high
  tags: text("tags").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budget Items
export const budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  category: varchar("category").notNull(), // food, transport, accommodation, activities, other
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: varchar("role").notNull(), // user, assistant
  content: text("content").notNull(),
  tripId: varchar("trip_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Journey Options (multi-modal transport)
export const journeyOptions = pgTable("journey_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  from: text("from").notNull(),
  to: text("to").notNull(),
  mode: varchar("mode").notNull(), // walking, transit, rideshare, flight
  duration: text("duration").notNull(),
  cost: real("cost").notNull(),
  distance: text("distance"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mood Readings (Silent Pulse)
export const moodReadings = pgTable("mood_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull().default("default-user"),
  energyLevel: varchar("energy_level").notNull(), // high, medium, low
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Pivot Logs
export const pivotLogs = pgTable("pivot_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  triggeredBy: varchar("triggered_by").notNull(), // user_consensus, manual
  previousActivityId: varchar("previous_activity_id"),
  newActivityId: varchar("new_activity_id"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true, spent: true, status: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true, completed: true });
export const insertDiscoverySchema = createInsertSchema(discoveries).omit({ id: true, createdAt: true });
export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertJourneyOptionSchema = createInsertSchema(journeyOptions).omit({ id: true, createdAt: true });
export const insertMoodReadingSchema = createInsertSchema(moodReadings).omit({ id: true, timestamp: true });
export const insertPivotLogSchema = createInsertSchema(pivotLogs).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Discovery = typeof discoveries.$inferSelect;
export type InsertDiscovery = z.infer<typeof insertDiscoverySchema>;

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type JourneyOption = typeof journeyOptions.$inferSelect;
export type InsertJourneyOption = z.infer<typeof insertJourneyOptionSchema>;

export type MoodReading = typeof moodReadings.$inferSelect;
export type InsertMoodReading = z.infer<typeof insertMoodReadingSchema>;

export type PivotLog = typeof pivotLogs.$inferSelect;
export type InsertPivotLog = z.infer<typeof insertPivotLogSchema>;
