import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
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

export async function generateTripItinerary(
  userMessage: string,
  preferences?: TravelPreferences
): Promise<{ response: string; trip?: GeneratedTrip }> {
  const systemPrompt = `You are VIVOT, an expert AI travel assistant that creates personalized, "Mindtrip-style" travel itineraries. 
  
  Your goal is to create immersive, logically sequenced, and highly detailed travel plans.
  
  ${preferences ? `
  User Preferences:
  - Budget: ${preferences.budget || "flexible"}
  - Interests: ${preferences.interests?.join(", ") || "general"}
  - Dietary: ${preferences.dietary?.join(", ") || "none"}
  - Pace: ${preferences.pace || "moderate"}
  - Travel Style: ${preferences.travelStyle || "flexible"}
  ` : ""}
  
  If the user is requesting a trip plan (e.g., "Plan a trip to Paris"), respond with a JSON object in this exact format:
  {
    "response": "A warm, engaging summary of the trip you've planned.",
    "trip": {
      "destination": "City, Country",
      "coordinates": { "lat": 0.0, "lng": 0.0 }, // CRITICAL: Precise coordinates of the city center. Do NOT return 0,0.
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "budget": number, // Minimum realistic estimated budget in USD
      "activities": [
        {
          "day": 1,
          "title": "Activity Name",
          "description": "A rich, inviting description of what to do there.",
          "category": "activity|restaurant|accommodation|transport",
          "time": "HH:MM",
          "duration": "X hours",
          "location": "Specific Address or Place Name",
          "coordinates": { "lat": 0.0, "lng": 0.0 }, // CRITICAL: Precise coordinates of the activity. Do NOT return 0,0.
          "imageKeyword": "Specific search term for a photo (e.g., 'Eiffel Tower sunset', 'Sushi platter')",
          "cost": number,
          "orderIndex": 0,
          "shadowOption": { // OPTIONAL: Only for high-energy/outdoor activities
            "title": "Relaxed Alternative",
            "description": "Description of the low-energy option",
            "category": "activity|restaurant",
            "time": "Same as main activity",
            "duration": "Same or similar",
            "location": "Nearby location",
            "coordinates": { "lat": 0.0, "lng": 0.0 },
            "cost": number
          }
        }
      ]
    }
  }
  
  **Guidelines for Excellence:**
  1. **Visual Richness**: Provide specific "imageKeyword" for every activity to help us find the perfect photo.
  2. **Logical Routing**: Ensure activities on the same day are geographically close.
  3. **Diverse Itinerary**: Mix famous landmarks with hidden gems and local food spots.
  4. **Shadow Options**: Always provide a low-energy alternative for strenuous activities.
  5. **Realism**: Include travel time and realistic durations.
  6. **Coordinates**: You MUST provide valid latitude and longitude for the destination and EVERY activity.
  7. **Budget**: Provide a realistic minimum budget estimate for the entire trip including accommodation, food, and activities.
  
  If the user is just chatting, respond with:
  {
    "response": "Your helpful conversational response"
  }`;

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

export async function analyzeUserPreferences(
  userHistory: string[]
): Promise<TravelPreferences> {
  const prompt = `Analyze these user selections and interactions to infer their travel preferences:

${userHistory.join("\n")}

Return a JSON object with inferred preferences:
{
  "budget": "low|medium|high|luxury",
  "interests": ["food", "adventure", "culture", etc.],
  "pace": "relaxed|moderate|fast-paced",
  "travelStyle": "solo|couple|family|group"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API error:", error);
    return {};
  }
}

export async function generatePivotProposal(
  currentActivity: any,
  context: { location: string; time: string; budgetRemaining: number; groupMood: string }
): Promise<{
  proposal: string;
  newActivity: {
    title: string;
    description: string;
    category: string;
    location: string;
    cost: number;
    duration: string;
  };
}> {
  const prompt = `The group is feeling ${context.groupMood} (tired/low energy). 
  
  Current planned activity: ${currentActivity.title} (${currentActivity.category}) at ${currentActivity.time}.
  Location: ${context.location}
  Budget Remaining: $${context.budgetRemaining}
  
  Generate a "Mood Pivot" proposal. Suggest a low-energy, relaxing alternative nearby.
  
  Return JSON:
  {
    "proposal": "Persuasive message proposing the change (e.g., 'It looks like a slow start! Let's swap the hike for a spa...')",
    "newActivity": {
      "title": "New Activity Name",
      "description": "Description",
      "category": "activity|restaurant|relaxation",
      "location": "Address/Location",
      "cost": number,
      "duration": "Duration string"
    }
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate pivot proposal");
  }
}
