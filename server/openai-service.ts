import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
        "orderIndex": 0
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

If the user is just chatting or asking questions (not planning a trip), respond with just:
{
  "response": "Your helpful conversational response"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
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
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1024,
    });

    return completion.choices[0].message.content || "No suggestions available";
  } catch (error) {
    console.error("OpenAI API error:", error);
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
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 512,
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {};
  }
}
