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

  // Chat Messages
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Journey Options
  getJourneyOptions(from: string, to: string): Promise<JourneyOption[]>;
  createJourneyOption(option: InsertJourneyOption): Promise<JourneyOption>;
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

  constructor() {
    this.users = new Map();
    this.preferences = new Map();
    this.trips = new Map();
    this.activities = new Map();
    this.discoveries = new Map();
    this.budgetItems = new Map();
    this.chatMessages = new Map();
    this.journeyOptions = new Map();

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
    const user: User = { ...insertUser, id };
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
      .filter((a) => a.tripId === tripId)
      .sort((a, b) => a.day - b.day || a.orderIndex - b.orderIndex);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      completed: false,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    const existing = this.activities.get(id);
    if (!existing) throw new Error("Activity not found");

    const updated: Activity = { ...existing, ...updates };
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
      createdAt: new Date(),
    };
    this.journeyOptions.set(id, option);
    return option;
  }

  // Seed data
  private seedDiscoveries() {
    const discoveries = [
      {
        title: "Hidden Temple in Ubud",
        description: "A secret temple nestled in the rice terraces, known only to locals",
        category: "hidden-gem" as const,
        location: "Ubud, Bali",
        imageUrl: "/api/placeholder/400/300",
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
        imageUrl: "/api/placeholder/400/300",
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
        imageUrl: "/api/placeholder/400/300",
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
        imageUrl: "/api/placeholder/400/300",
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
        imageUrl: "/api/placeholder/400/300",
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
        imageUrl: "/api/placeholder/400/300",
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
