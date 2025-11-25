import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MoodPulseProps {
    tripId: string;
}

export function MoodPulse({ tripId }: MoodPulseProps) {
    const [selectedMood, setSelectedMood] = useState<"low" | "medium" | "high" | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (energyLevel: "low" | "medium" | "high") => {
            const res = await apiRequest("POST", `/api/trips/${tripId}/mood`, {
                tripId,
                energyLevel,
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Mood Recorded",
                description: "Your energy level has been shared anonymously.",
            });
            setSelectedMood(null);

            if (data.shouldPivot) {
                toast({
                    title: "Pivot Triggered",
                    description: "Group energy is low. Finding relaxing alternatives...",
                    variant: "destructive", // Use destructive to grab attention, or default
                });
                // In a real app, this would trigger the Pivot Proposal modal
                // For now, we'll just invalidate queries to refresh the dashboard
                queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}`] });
            }
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to record mood.",
                variant: "destructive",
            });
        },
    });

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                    Silent Pulse
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    How is the group feeling right now?
                </p>
                <div className="flex justify-between gap-2">
                    <Button
                        variant={selectedMood === "low" ? "default" : "outline"}
                        className="flex-1 flex-col h-auto py-3 gap-1 hover:bg-red-100 hover:text-red-600 border-red-200"
                        onClick={() => mutation.mutate("low")}
                        disabled={mutation.isPending}
                    >
                        <BatteryLow className="h-6 w-6 text-red-500" />
                        <span className="text-xs">Low</span>
                    </Button>
                    <Button
                        variant={selectedMood === "medium" ? "default" : "outline"}
                        className="flex-1 flex-col h-auto py-3 gap-1 hover:bg-yellow-100 hover:text-yellow-600 border-yellow-200"
                        onClick={() => mutation.mutate("medium")}
                        disabled={mutation.isPending}
                    >
                        <BatteryMedium className="h-6 w-6 text-yellow-500" />
                        <span className="text-xs">Okay</span>
                    </Button>
                    <Button
                        variant={selectedMood === "high" ? "default" : "outline"}
                        className="flex-1 flex-col h-auto py-3 gap-1 hover:bg-green-100 hover:text-green-600 border-green-200"
                        onClick={() => mutation.mutate("high")}
                        disabled={mutation.isPending}
                    >
                        <BatteryFull className="h-6 w-6 text-green-500" />
                        <span className="text-xs">High</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
