import {
  type User,
  type InsertUser,
  type UserPreferences,
  type InsertUserPreferences,
  type Trip,
  type InsertTrip,
  type Activity,
  type InsertActivity,
  type Discovery,
  type InsertDiscovery,
  type BudgetItem,
  type InsertBudgetItem,
  type ChatMessage,
  type InsertChatMessage,
  type JourneyOption,
  type InsertJourneyOption,
  type MoodReading,
  type InsertMoodReading,
  type PivotLog,
  type InsertPivotLog,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Preferences
  getPreferences(userId: string): Promise<UserPreferences | undefined>;
  createPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updatePreferences(id: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  // Trips
  getTrip(id: string): Promise<Trip | undefined>;
  getTripsByUser(userId: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip>;
  updateTripSpent(id: string, spent: number): Promise<Trip>;

  // Activities
  getActivity(id: string): Promise<Activity | undefined>;
  getActivitiesByTrip(tripId: string): Promise<Activity[]>;
  getShadowActivities(tripId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<Activity>): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;

  // Discoveries
  getDiscovery(id: string): Promise<Discovery | undefined>;
  getAllDiscoveries(): Promise<Discovery[]>;
  getFeaturedDiscoveries(): Promise<Discovery[]>;
  createDiscovery(discovery: InsertDiscovery): Promise<Discovery>;

  // Budget Items
  getBudgetItem(id: string): Promise<BudgetItem | undefined>;
  getBudgetItemsByTrip(tripId: string): Promise<BudgetItem[]>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  deleteBudgetItem(id: string): Promise<void>;

  // Chat Messages
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Journey Options
  getJourneyOptions(from: string, to: string): Promise<JourneyOption[]>;
  createJourneyOption(option: InsertJourneyOption): Promise<JourneyOption>;

  // Mood Readings
  createMoodReading(reading: InsertMoodReading): Promise<MoodReading>;
  getMoodReadings(tripId: string): Promise<MoodReading[]>;

  // Pivot Logs
  createPivotLog(log: InsertPivotLog): Promise<PivotLog>;
  getPivotLogs(tripId: string): Promise<PivotLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private preferences: Map<string, UserPreferences>;
  private trips: Map<string, Trip>;
  private activities: Map<string, Activity>;
  private discoveries: Map<string, Discovery>;
  private budgetItems: Map<string, BudgetItem>;
  private chatMessages: Map<string, ChatMessage>;
  private journeyOptions: Map<string, JourneyOption>;
  private moodReadings: Map<string, MoodReading>;
  private pivotLogs: Map<string, PivotLog>;

  constructor() {
    this.users = new Map();
    this.preferences = new Map();
    this.trips = new Map();
    this.activities = new Map();
    this.discoveries = new Map();
    this.budgetItems = new Map();
    this.chatMessages = new Map();
    this.journeyOptions = new Map();
    this.moodReadings = new Map();
    this.pivotLogs = new Map();

    this.seedDiscoveries();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // User Preferences
  async getPreferences(userId: string): Promise<UserPreferences | undefined> {
    return Array.from(this.preferences.values()).find((p) => p.userId === userId);
  }

  async createPreferences(insertPrefs: InsertUserPreferences): Promise<UserPreferences> {
    const id = randomUUID();
    const prefs: UserPreferences = {
      ...insertPrefs,
      id,
      userId: insertPrefs.userId || "default-user",
      updatedAt: new Date(),
    };
    this.preferences.set(id, prefs);
    return prefs;
  }

  async updatePreferences(id: string, updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = this.preferences.get(id);
    if (!existing) throw new Error("Preferences not found");

    const updated: UserPreferences = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.preferences.set(id, updated);
    return updated;
  }

  // Trips
  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTripsByUser(userId: string): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = randomUUID();
    const trip: Trip = {
      ...insertTrip,
      id,
      userId: insertTrip.userId || "default-user",
      imageUrl: insertTrip.imageUrl || null,
      coordinates: insertTrip.coordinates || null,
      spent: 0,
      status: "planning",
      createdAt: new Date(),
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip> {
    const existing = this.trips.get(id);
    if (!existing) throw new Error("Trip not found");

    const updated: Trip = { ...existing, ...updates };
    this.trips.set(id, updated);
    return updated;
  }

  async updateTripSpent(id: string, spent: number): Promise<Trip> {
    const existing = this.trips.get(id);
    if (!existing) throw new Error("Trip not found");

    const updated: Trip = { ...existing, spent };
    this.trips.set(id, updated);
    return updated;
  }

  // Activities
  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByTrip(tripId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.tripId === tripId && !a.isShadowOption)
      .sort((a, b) => a.day - b.day || a.orderIndex - b.orderIndex);
  }

  async getShadowActivities(tripId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.tripId === tripId && a.isShadowOption);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      description: insertActivity.description || null,
      duration: insertActivity.duration || null,
      imageUrl: insertActivity.imageUrl || null,
      cost: insertActivity.cost || 0,
      completed: false,
      isShadowOption: insertActivity.isShadowOption ?? false,
      parentActivityId: insertActivity.parentActivityId ?? null,
      energyLevelRequirement: insertActivity.energyLevelRequirement ?? "high",
      coordinates: insertActivity.coordinates || null,
      imageKeyword: insertActivity.imageKeyword || null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    const existing = this.activities.get(id);
    if (!existing) throw new Error("Activity not found");

    // Only allow SAFE fields to be updated
    const allowedFields: (keyof Activity)[] = [
      "title",
      "description",
      "category",
      "time",
      "duration",
      "location",
      "cost",
      "completed",
      "energyLevelRequirement",
      "isShadowOption",
      "imageUrl",
    ];

    const sanitizedUpdates: Partial<Activity> = {};

    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key as keyof Activity)) {
        (sanitizedUpdates as any)[key] = (updates as any)[key];
      } else {
        console.warn(`Blocked update to field: ${key}`);
      }
    }

    const updated: Activity = {
      ...existing,
      ...sanitizedUpdates,
    };

    this.activities.set(id, updated);
    return updated;
  }


  async deleteActivity(id: string): Promise<void> {
    this.activities.delete(id);
  }

  // Discoveries
  async getDiscovery(id: string): Promise<Discovery | undefined> {
    return this.discoveries.get(id);
  }

  async getAllDiscoveries(): Promise<Discovery[]> {
    return Array.from(this.discoveries.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getFeaturedDiscoveries(): Promise<Discovery[]> {
    return Array.from(this.discoveries.values())
      .filter((d) => d.rating >= 4.3)
      .slice(0, 6);
  }

  async createDiscovery(insertDiscovery: InsertDiscovery): Promise<Discovery> {
    const id = randomUUID();
    const discovery: Discovery = {
      ...insertDiscovery,
      id,
      rating: insertDiscovery.rating || 4.5,
      createdAt: new Date(),
    };
    this.discoveries.set(id, discovery);
    return discovery;
  }

  // Budget Items
  async getBudgetItem(id: string): Promise<BudgetItem | undefined> {
    return this.budgetItems.get(id);
  }

  async getBudgetItemsByTrip(tripId: string): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values())
      .filter((b) => b.tripId === tripId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createBudgetItem(insertItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = randomUUID();
    const item: BudgetItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.budgetItems.set(id, item);
    return item;
  }

  async deleteBudgetItem(id: string): Promise<void> {
    this.budgetItems.delete(id);
  }

  // Chat Messages
  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      tripId: insertMessage.tripId || null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async updateChatMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    const existing = this.chatMessages.get(id);
    if (!existing) throw new Error("Chat message not found");

    const updated: ChatMessage = { ...existing, ...updates };
    this.chatMessages.set(id, updated);
    return updated;
  }

  // Journey Options
  async getJourneyOptions(from: string, to: string): Promise<JourneyOption[]> {
    return Array.from(this.journeyOptions.values()).filter(
      (j) => j.from === from && j.to === to
    );
  }

  async createJourneyOption(insertOption: InsertJourneyOption): Promise<JourneyOption> {
    const id = randomUUID();
    const option: JourneyOption = {
      ...insertOption,
      id,
      distance: insertOption.distance || null,
      details: insertOption.details || null,
      createdAt: new Date(),
    };
    this.journeyOptions.set(id, option);
    return option;
  }

  // Mood Readings
  async createMoodReading(insertReading: InsertMoodReading): Promise<MoodReading> {
    const id = randomUUID();
    const reading: MoodReading = {
      ...insertReading,
      id,
      userId: insertReading.userId || "default-user",
      timestamp: new Date(),
    };
    this.moodReadings.set(id, reading);
    return reading;
  }

  async getMoodReadings(tripId: string): Promise<MoodReading[]> {
    return Array.from(this.moodReadings.values())
      .filter((r) => r.tripId === tripId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Pivot Logs
  async createPivotLog(insertLog: InsertPivotLog): Promise<PivotLog> {
    const id = randomUUID();
    const log: PivotLog = {
      ...insertLog,
      id,
      previousActivityId: insertLog.previousActivityId || null,
      newActivityId: insertLog.newActivityId || null,
      reason: insertLog.reason || null,
      createdAt: new Date(),
    };
    this.pivotLogs.set(id, log);
    return log;
  }

  async getPivotLogs(tripId: string): Promise<PivotLog[]> {
    return Array.from(this.pivotLogs.values())
      .filter((l) => l.tripId === tripId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Seed data
  private seedDiscoveries() {
    const discoveries = [
      {
        title: "Hidden Temple in Ubud",
        description: "A secret temple nestled in the rice terraces, known only to locals",
        category: "hidden-gem" as const,
        location: "Ubud, Bali",
        imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
        rating: 4.8,
        sentiment: "hidden-gem" as const,
        cost: "low" as const,
        tags: ["culture", "nature", "photography"],
      },
      {
        title: "Street Food Night Market",
        description: "Authentic local cuisine experience with over 50 vendors",
        category: "local-experience" as const,
        location: "Bangkok, Thailand",
        imageUrl: "https://images.unsplash.com/photo-1555529733-0e670560f7e1",
        rating: 4.6,
        sentiment: "local-favorite" as const,
        cost: "low" as const,
        tags: ["food", "culture", "nightlife"],
      },
      {
        title: "Glacier Hiking Adventure",
        description: "Trek across stunning blue ice formations with expert guides",
        category: "adventure" as const,
        location: "Patagonia, Argentina",
        imageUrl: "https://images.unsplash.com/photo-1518182170546-07661fd94144",
        rating: 4.9,
        sentiment: "highly-rated" as const,
        cost: "high" as const,
        tags: ["adventure", "nature", "outdoor"],
      },
      {
        title: "Historic Medina Walking Tour",
        description: "Explore centuries-old architecture and vibrant souks",
        category: "popular" as const,
        location: "Marrakech, Morocco",
        imageUrl: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70",
        rating: 4.5,
        sentiment: "trending" as const,
        cost: "medium" as const,
        tags: ["culture", "history", "shopping"],
      },
      {
        title: "Sunrise Hot Air Balloon",
        description: "Float above ancient temples at dawn for breathtaking views",
        category: "popular" as const,
        location: "Bagan, Myanmar",
        imageUrl: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7",
        rating: 4.9,
        sentiment: "highly-rated" as const,
        cost: "high" as const,
        tags: ["adventure", "photography", "nature"],
      },
      {
        title: "Traditional Pottery Workshop",
        description: "Learn ancient ceramic techniques from master artisans",
        category: "local-experience" as const,
        location: "Kyoto, Japan",
        imageUrl: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9",
        rating: 4.7,
        sentiment: "local-favorite" as const,
        cost: "medium" as const,
        tags: ["culture", "art", "hands-on"],
      },
    ];

    discoveries.forEach((d) => {
      const id = randomUUID();
      this.discoveries.set(id, {
        ...d,
        id,
        createdAt: new Date(),
      });
    });
  }
}

export const storage = new MemStorage();
