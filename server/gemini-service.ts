import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface TravelPreferences {
  budget?: string;
  interests?: string[];
  dietary?: string[];
  pace?: string;
  travelStyle?: string;
}

interface GeneratedTrip {
  destination: string;
  coordinates: { lat: number; lng: number };
  startDate: string;
  endDate: string;
  budget: number;
  activities: Array<{
    day: number;
    title: string;
    description: string;
    category: string;
    time: string;
    duration: string;
    location: string;
    coordinates: { lat: number; lng: number };
    imageKeyword: string;
    cost: number;
    orderIndex: number;
    shadowOption?: {
      title: string;
      description: string;
      category: string;
      time: string;
      duration: string;
      location: string;
      coordinates: { lat: number; lng: number };
      cost: number;
    };
  }>;
}

/* ============================================================================================
   TRIP GENERATION (UNCHANGED)
============================================================================================ */

export async function generateTripItinerary(
  userMessage: string,
  preferences?: TravelPreferences
): Promise<{ response: string; trip?: GeneratedTrip }> {
  // Get current date for context
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split("T")[0];
  const currentYear = currentDate.getFullYear();

  const systemPrompt = `You are VIVOT, an expert AI travel assistant that creates personalized, adaptive, and wellness-aware itineraries inspired by Mindtrip.ai.

IMPORTANT CONTEXT:
- Today's date is: ${currentDateStr}
- Current year: ${currentYear}
- All trip dates MUST be in ${currentYear} or later, never in past years

You support:
- Standard trip generation
- Mood Pivot
- Care Mode (individual health/wellness micro-itineraries)

${preferences ? `
User Preferences:
- Budget: ${preferences.budget || "flexible"}
- Interests: ${preferences.interests?.join(", ") || "general"}
- Dietary: ${preferences.dietary?.join(", ") || "none"}
- Pace: ${preferences.pace || "moderate"}
- Travel Style: ${preferences.travelStyle || "flexible"}` : ""}

If the user is requesting a trip plan (e.g., "Plan a trip to Paris"), respond ONLY with:

{
  "response": "Short warm summary",
  "trip": {
    "destination": "City, Country",
    "coordinates": { "lat": 0.0, "lng": 0.0 },
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "budget": number,
    "activities": [
      {
        "day": 1,
        "title": "Activity Title",
        "description": "Inviting, vivid description",
        "category": "activity|restaurant|accommodation|transport",
        "time": "HH:MM",
        "duration": "X hours",
        "location": "Place name",
        "coordinates": { "lat": 0.0, "lng": 0.0 },
        "imageKeyword": "Eiffel Tower sunset",
        "cost": number,
        "orderIndex": 0,
        "shadowOption": {
          "title": "Relax Alternative",
          "description": "Alternative low-energy option",
          "category": "activity|restaurant",
          "time": "HH:MM",
          "duration": "X hours",
          "location": "Place name",
          "coordinates": { "lat": 0.0, "lng": 0.0 },
          "cost": number
        }
      }
    ]
  }
}

Rules:
1. Every activity MUST have realistic coordinates.
2. Every activity MUST include imageKeyword.
3. Shadow options MUST exist for strenuous activities.
4. JSON ONLY. Never return prose unless "chatting".
5. CRITICAL: startDate and endDate MUST be ${currentDateStr} or later. NEVER use dates from ${currentYear - 1} or earlier.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: userMessage,
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate itinerary");
  }
}

/* ============================================================================================
   CARE MODE ENGINE (NEW)
============================================================================================ */

export async function generateCareModePlan(
  condition: string,
  destination: string,
  currentActivity?: string
): Promise<any> {
  const prompt = `
You are VIVOT's Care Mode engine.

User reported: "${condition}"
Trip destination: ${destination}
Current activity: ${currentActivity || "general sightseeing"}

Generate a wellness micro-itinerary in JSON ONLY using this schema:

{
  "condition": "...",
  "personalPlan": [
    {
      "title": "...",
      "description": "...",
      "recommendedDuration": "...",
      "placeType": "...",
      "imageKeyword": "...",
      "coordinates": { "lat": 0, "lng": 0 }
    }
  ],
  "groupPlan": [
    {
      "title": "...",
      "description": "...",
      "recommendedAdjustment": "...",
      "reasoning": "...",
      "imageKeyword": "..."
    }
  ],
  "recheckInMinutes": 30
}

Rules:
- personalPlan MUST be calm, gentle, safe.
- groupPlan MUST adjust trip minimally.
- Always produce valid JSON.
- Be empathetic but concise.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Care Mode Error:", error);
    throw new Error("Failed to generate Care Mode plan");
  }
}

/* ============================================================================================
   PIVOT ENGINE (UNCHANGED)
============================================================================================ */

export async function adaptItinerary(
  currentActivities: string,
  context: { weather?: string; time?: string; budgetRemaining?: number }
): Promise<string> {
  const prompt = `Given the current itinerary and context, suggest adaptations:

Current Activities:
${currentActivities}

Context:
- Weather: ${context.weather || "unknown"}
- Current Time: ${context.time || "unknown"}
- Budget Remaining: $${context.budgetRemaining || "unknown"}

Provide 2-3 smart alternative suggestions that adapt to the current conditions.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No suggestions available";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Unable to generate suggestions at this time.";
  }
}

/* ============================================================================================
   USER PREFERENCES (UNCHANGED)
============================================================================================ */

export async function analyzeUserPreferences(
  userHistory: string[]
): Promise<TravelPreferences> {
  const prompt = `Analyze these user selections and interactions to infer their travel preferences:

${userHistory.join("\n")}

Return a JSON object:
{
  "budget": "...",
  "interests": [...],
  "pace": "...",
  "travelStyle": "..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API error:", error);
    return {};
  }
}

/* ============================================================================================
   PIVOT PROPOSAL (UNCHANGED)
============================================================================================ */

export async function generatePivotProposal(
  currentActivity: any,
  context: { location: string; time: string; budgetRemaining: number; groupMood: string }
): Promise<any> {
  const prompt = `The group is feeling ${context.groupMood}. 

Current planned activity: ${currentActivity.title} (${currentActivity.category}) at ${currentActivity.time}.
Location: ${context.location}
Budget Remaining: $${context.budgetRemaining}

Generate a Mood Pivot proposal:
{
  "proposal": "...",
  "newActivity": {
    "title": "...",
    "description": "...",
    "category": "activity|restaurant|relaxation",
    "location": "...",
    "cost": number,
    "duration": "..."
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate pivot proposal");
  }
}
