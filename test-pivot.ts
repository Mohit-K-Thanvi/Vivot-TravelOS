import { insertTripSchema } from "./shared/schema";

async function runTest() {
    const baseUrl = "http://localhost:5002/api";

    console.log("🚀 Starting Mood Pivot Feature Test...");

    // 1. Create Trip
    console.log("\n1️⃣  Creating a new trip to Paris...");
    const tripRes = await fetch(`${baseUrl}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            destination: "Paris",
            startDate: "2023-10-01",
            endDate: "2023-10-05",
            budget: 2000
        })
    });
    const trip = await tripRes.json();
    console.log("   ✅ Trip created with ID:", trip.id);

    // 2. Create Activity
    console.log("\n2️⃣  Adding a High-Energy Activity (Mountain Hike)...");
    const activityRes = await fetch(`${baseUrl}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tripId: trip.id,
            day: 1,
            title: "Mountain Hike",
            category: "activity",
            time: "09:00",
            location: "Alps",
            cost: 0,
            orderIndex: 0,
            energyLevelRequirement: "high"
        })
    });
    const activity = await activityRes.json();
    console.log("   ✅ Activity created:", activity.title);

    // 3. Record Mood
    console.log("\n3️⃣  Recording 'Low' Energy Mood for the group...");
    const moodRes = await fetch(`${baseUrl}/trips/${trip.id}/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tripId: trip.id,
            energyLevel: "low"
        })
    });
    const moodData = await moodRes.json();
    console.log("   ✅ Mood recorded.");
    console.log("   ⚠️  Should Pivot?", moodData.shouldPivot ? "YES" : "NO");

    if (moodData.shouldPivot) {
        // 4. Trigger Pivot
        console.log("\n4️⃣  Triggering Pivot Engine to find alternatives...");
        const pivotRes = await fetch(`${baseUrl}/trips/${trip.id}/pivot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentActivityId: activity.id,
                location: "Alps",
                time: "09:00",
                budgetRemaining: 2000
            })
        });
        const pivotProposal = await pivotRes.json();
        console.log("   ✨ Pivot Proposal Received:");
        console.log(`      "${pivotProposal.proposal}"`);
        console.log("   🆕 Proposed Activity:", pivotProposal.newActivity.title);

        // 5. Confirm Pivot
        console.log("\n5️⃣  Confirming the Pivot...");
        const confirmRes = await fetch(`${baseUrl}/trips/${trip.id}/pivot/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                oldActivityId: activity.id,
                newActivityData: pivotProposal.newActivity,
                reason: "Group energy low"
            })
        });
        const updatedActivity = await confirmRes.json();
        console.log("   ✅ Pivot Confirmed! Itinerary updated.");
        console.log("   📍 New Plan:", updatedActivity.title);
    }
}

runTest().catch(console.error);
