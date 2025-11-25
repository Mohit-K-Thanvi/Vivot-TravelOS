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
    cost: number;
    orderIndex: number;
    shadowOption?: {
      title: string;
      description: string;
      category: string;
      time: string;
      duration: string;
      location: string;
      cost: number;
    };
  }>;
}

export async function generateTripItinerary(
  userMessage: string,
  preferences?: TravelPreferences
): Promise<{ response: string; trip?: GeneratedTrip }> {
  const systemPrompt = `You are VIVOT, an expert AI travel assistant that creates personalized travel itineraries. 

Your task is to analyze the user's travel request and create a detailed, day-by-day itinerary if they're asking for trip planning.

${preferences ? `
User Preferences:
- Budget: ${preferences.budget || "flexible"}
- Interests: ${preferences.interests?.join(", ") || "general"}
- Dietary: ${preferences.dietary?.join(", ") || "none"}
- Pace: ${preferences.pace || "moderate"}
- Travel Style: ${preferences.travelStyle || "flexible"}
` : ""}

If the user is requesting a trip plan, respond with a JSON object in this exact format:
{
  "response": "Your conversational response to the user",
  "trip": {
    "destination": "City, Country",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "budget": number (total budget in USD),
    "activities": [
      {
        "day": 1,
        "title": "Activity name",
        "description": "Brief description",
        "category": "activity|restaurant|accommodation|transport",
        "time": "HH:MM AM/PM",
        "duration": "X hours",
        "location": "Specific location",
        "cost": number (in USD),
        "orderIndex": 0,
        "shadowOption": { // OPTIONAL: Only for high-energy/outdoor activities
          "title": "Relaxed alternative (e.g. Spa, Cafe)",
          "description": "Brief description of low-energy alternative",
          "category": "activity|restaurant",
          "time": "Same as main activity",
          "duration": "Same or similar",
          "location": "Nearby location (<5km)",
          "cost": number
        }
      }
    ]
  }
}

Create realistic, well-paced itineraries with:
- Mix of activities (meals, sightseeing, rest)
- Realistic timing and durations
- Costs that fit the budget
- Consideration for dietary restrictions
- Activities matching interests
- Appropriate pace (relaxed = 2-3 activities/day, moderate = 3-4, fast = 5+)
- **Shadow Options**: For every high-energy or outdoor activity (hiking, long walking tours), ALWAYS provide a "shadowOption" that is low-energy (spa, museum, cafe) and nearby.

If the user is just chatting or asking questions (not planning a trip), respond with just:
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
