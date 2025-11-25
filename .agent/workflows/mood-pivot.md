---
description: How to use the Mood Pivot feature
---

# Mood Pivot Feature Workflow

This workflow describes how to use the Mood Pivot feature to dynamically adapt the itinerary based on group energy levels.

## 1. Create a Trip and Activities
- Create a trip using `POST /api/trips`.
- Create activities using `POST /api/activities`.
  - For high-energy activities, set `energyLevelRequirement: "high"`.
  - The system (via AI) will automatically generate "Shadow Options" (low-energy alternatives) for high-energy activities.

## 2. Record Mood Readings ("Silent Pulse")
- Users submit their energy levels using `POST /api/trips/:id/mood`.
- Body: `{ "tripId": "...", "energyLevel": "low" | "medium" | "high" }`
- The response includes `shouldPivot: boolean`.
- If `shouldPivot` is true (e.g., >40% of group is low energy), the frontend should trigger the pivot flow.

## 3. Trigger Pivot Proposal
- Call `POST /api/trips/:id/pivot`.
- Body:
  ```json
  {
    "currentActivityId": "...",
    "location": "Current Location",
    "time": "Current Time",
    "budgetRemaining": 1000
  }
  ```
- The system checks for a pre-planned "Shadow Option".
- If none exists, it uses AI to generate a new proposal on the fly.
- Response:
  ```json
  {
    "proposal": "Persuasive message...",
    "newActivity": { ... },
    "isPrePlanned": boolean
  }
  ```

## 4. Confirm Pivot
- The organizer confirms the pivot using `POST /api/trips/:id/pivot/confirm`.
- Body:
  ```json
  {
    "oldActivityId": "...",
    "newActivityData": { ... }, // from the proposal
    "reason": "Group energy low"
  }
  ```
- The system updates the activity in the database and logs the pivot event.
- The itinerary is now updated with the low-energy alternative.
