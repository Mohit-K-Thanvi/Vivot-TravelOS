import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Insert schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true, spent: true, status: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true, completed: true });
export const insertDiscoverySchema = createInsertSchema(discoveries).omit({ id: true, createdAt: true });
export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertJourneyOptionSchema = createInsertSchema(journeyOptions).omit({ id: true, createdAt: true });

// Types
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
