import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Loader2, Sparkles, Users, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CareModeModalProps {
    tripId: string;
    destination: string;
    selectedDay: number;
}

interface CarePlan {
    condition: string;
    personalPlan: Array<{
        title: string;
        description: string;
        recommendedDuration: string;
        placeType: string;
        imageKeyword?: string;
        coordinates?: { lat: number; lng: number };
    }>;
    groupPlan: Array<{
        title: string;
        description: string;
        recommendedAdjustment: string;
        reasoning: string;
    }>;
    recheckInMinutes: number;
}

export function CareModeModal({ tripId, destination, selectedDay }: CareModeModalProps) {
    const [open, setOpen] = useState(false);
    const [condition, setCondition] = useState("");
    const { toast } = useToast();

    const generatePlanMutation = useMutation({
        mutationFn: async (condition: string) => {
            const res = await apiRequest("POST", `/api/trips/${tripId}/care-mode`, {
                condition,
                destination,
            });
            return await res.json();
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to generate care plan. Please try again.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!condition.trim()) return;
        generatePlanMutation.mutate(condition);
    };

    const plan = generatePlanMutation.data as CarePlan | undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                >
                    <Heart className="h-4 w-4" />
                    Care Mode
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
                        Care Mode
                    </DialogTitle>
                    <DialogDescription>
                        Not feeling 100%? Tell us what's wrong, and we'll adjust the plan for you and your group.
                    </DialogDescription>
                </DialogHeader>

                {!plan ? (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="condition">How are you feeling?</Label>
                            <Input
                                id="condition"
                                placeholder="e.g., I have a migraine, feeling anxious, twisted my ankle..."
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                disabled={generatePlanMutation.isPending}
                                className="text-base"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={!condition.trim() || generatePlanMutation.isPending}
                        >
                            {generatePlanMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating Wellness Plan...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate Care Plan
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                        <div className="space-y-6 py-4">
                            <div className="rounded-lg bg-rose-50 p-4 text-rose-900 border border-rose-100">
                                <p className="font-medium">Condition: {plan.condition}</p>
                                <p className="text-sm text-rose-700 mt-1">
                                    We've created a personalized wellness plan for you.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-semibold text-lg">
                                    <Heart className="h-5 w-5 text-rose-500" />
                                    Your Personal Plan
                                </h3>
                                {plan.personalPlan.map((item, i) => (
                                    <Card key={i} className="bg-rose-50 border-rose-100 shadow-sm">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-rose-900">{item.title}</h4>
                                                <span className="text-xs font-medium bg-white text-rose-700 px-2 py-1 rounded-full border border-rose-200">
                                                    {item.recommendedDuration}
                                                </span>
                                            </div>
                                            <p className="text-sm text-rose-800">{item.description}</p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full mt-2 bg-white text-rose-700 hover:bg-rose-100 border border-rose-200"
                                                onClick={async () => {
                                                    try {
                                                        await apiRequest("POST", "/api/activities", {
                                                            tripId,
                                                            day: selectedDay,
                                                            title: item.title,
                                                            description: item.description,
                                                            category: "activity",
                                                            time: "09:00", // Default time
                                                            duration: item.recommendedDuration,
                                                            location: destination, // Default to trip destination if specific location not provided
                                                            cost: 0,
                                                            orderIndex: 999, // Append to end
                                                            imageKeyword: item.imageKeyword || "wellness",
                                                            coordinates: item.coordinates || { lat: 0, lng: 0 }
                                                        });
                                                        toast({
                                                            title: "Added to Itinerary",
                                                            description: `${item.title} has been added to Day ${selectedDay}.`,
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "activities"] });
                                                    } catch (error) {
                                                        toast({
                                                            title: "Error",
                                                            description: "Failed to add activity.",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add to Day {selectedDay}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-semibold text-lg">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Group Adjustments
                                </h3>
                                {plan.groupPlan.map((item, i) => (
                                    <Card key={i} className="bg-blue-50 border-blue-100 shadow-sm">
                                        <CardContent className="p-4 space-y-2">
                                            <h4 className="font-medium text-blue-900">{item.title}</h4>
                                            <p className="text-sm text-blue-800">{item.description}</p>
                                            <div className="bg-white p-3 rounded-md text-sm text-blue-900 border border-blue-200">
                                                <strong>Adjustment:</strong> {item.recommendedAdjustment}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setCondition("");
                                    generatePlanMutation.reset();
                                }}
                            >
                                Start Over
                            </Button>
                        </div >
                    </div >
                )
                }
            </DialogContent >
        </Dialog >
    );
}
