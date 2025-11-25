import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CareModeModal } from "@/components/care-mode-modal";
import {
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ArrowLeft,
  List,
  Map as MapIcon,
  Wallet,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Trip, Activity, BudgetItem } from "@shared/schema";

export default function TripDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeTab, setActiveTab] = useState("itinerary");

  const { data: trip, isLoading: tripLoading } = useQuery<Trip>({
    queryKey: ["/api/trips", id],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/trips", id, "activities"],
    enabled: !!id,
  });

  const { data: budgetItems, isLoading: budgetLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/trips", id, "budget"],
    enabled: !!id,
  });

  const toggleActivityMutation = useMutation({
    mutationFn: async ({ activityId, completed }: { activityId: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/activities/${activityId}`, { completed });
    },
    onMutate: async ({ activityId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/trips", id, "activities"] });
      const previousActivities = queryClient.getQueryData<Activity[]>(["/api/trips", id, "activities"]);
      queryClient.setQueryData<Activity[]>(["/api/trips", id, "activities"], (old) => {
        if (!old) return [];
        return old.map((a) =>
          a.id === activityId ? { ...a, completed } : a
        );
      });
      return { previousActivities };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id] });
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["/api/trips", id, "activities"], context?.previousActivities);
      toast({
        title: "Error",
        description: "Failed to update activity status.",
        variant: "destructive",
      });
    },
  });

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Trip not found</h2>
          <p className="mb-4 text-muted-foreground">
            The trip you're looking for doesn't exist
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dayActivities = activities?.filter((a) => a.day === selectedDay) || [];
  const totalDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
    (1000 * 60 * 60 * 24),
  ) + 1;

  const categoryTotals = budgetItems?.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  // Helper to get image URL
  const getImageUrl = (activity: Activity) => {
    if (activity.imageUrl) return activity.imageUrl;
    if ((activity as any).imageKeyword) {
      return `https://image.pollinations.ai/prompt/${encodeURIComponent((activity as any).imageKeyword)}?width=800&height=600&nologo=true`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{trip.destination}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{trip.startDate} - {trip.endDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    ${trip.spent.toFixed(0)} spent / {activities?.reduce((sum, act) => sum + act.cost, 0).toFixed(0) || 0} est. / ${trip.budget.toFixed(0)} budget
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm capitalize">
                {trip.status}
              </Badge>
              <CareModeModal tripId={trip.id} destination={trip.destination} selectedDay={selectedDay} />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={(trip.spent / trip.budget) * 100} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {((trip.spent / trip.budget) * 100).toFixed(0)}% of budget used
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="itinerary" data-testid="tab-itinerary">
              <List className="mr-2 h-4 w-4" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">
              <MapIcon className="mr-2 h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="budget" data-testid="tab-budget">
              <Wallet className="mr-2 h-4 w-4" />
              Budget
            </TabsTrigger>
          </TabsList>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(day)}
                    data-testid={`button-day-${day}`}
                  >
                    Day {day}
                  </Button>
                ))}
              </div>
            </div>

            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : dayActivities.length > 0 ? (
              <div className="space-y-4">
                {dayActivities
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((activity) => {
                    const imgUrl = getImageUrl(activity);
                    return (
                      <Card
                        key={activity.id}
                        className="overflow-hidden hover-elevate"
                        data-testid={`activity-${activity.id}`}
                      >
                        <div className="flex flex-col md:flex-row">
                          {imgUrl && (
                            <img
                              src={imgUrl}
                              alt={activity.title}
                              className="h-48 w-full object-cover md:h-auto md:w-48"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 p-4">
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={activity.completed}
                                  onCheckedChange={(checked) => {
                                    toggleActivityMutation.mutate({
                                      activityId: activity.id,
                                      completed: !!checked,
                                    });
                                  }}
                                  data-testid={`checkbox-activity-${activity.id}`}
                                />
                                <div>
                                  <h3 className="font-semibold">{activity.title}</h3>
                                  {activity.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary" className="capitalize">
                                {activity.category}
                              </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{activity.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-primary"
                                >
                                  {activity.location}
                                </a>
                              </div>
                              {activity.cost > 0 && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{activity.cost.toFixed(0)}</span>
                                </div>
                              )}
                              {activity.duration && (
                                <div className="flex items-center gap-1">
                                  <span>{activity.duration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No activities for Day {selectedDay}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Activities for this day haven't been planned yet
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card className="h-[600px] w-full overflow-hidden p-0 relative z-0">
              <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                <MapIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Map View</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Interactive map view is currently unavailable.
                </p>
                {activities && activities.length > 0 && (
                  <div className="mt-4 w-full max-w-md space-y-2">
                    <h4 className="font-semibold text-sm mb-2">Activity Locations:</h4>
                    {activities.map((activity) => (
                      <div key={activity.id} className="text-left border border-border rounded-lg p-3">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${trip.spent.toFixed(0)}</span>
                        <span className="text-sm text-muted-foreground">of {trip.budget.toFixed(0)}</span>
                      </div>
                      <Progress value={(trip.spent / trip.budget) * 100} className="h-3" />
                    </div>
                    <div className="space-y-2 border-t border-border pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">${(trip.budget - trip.spent).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">% Used</span>
                        <span className="font-medium">{((trip.spent / trip.budget) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(categoryTotals).map(([category, amount]) => (
                      <div key={category}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">${amount.toFixed(0)}</span>
                        </div>
                        <Progress value={(amount / trip.budget) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {budgetLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : budgetItems && budgetItems.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {budgetItems
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                          data-testid={`budget-item-${item.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.date} • {item.category}
                            </p>
                          </div>
                          <span className="font-semibold">${item.amount.toFixed(0)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No expenses yet</h3>
                <p className="text-sm text-muted-foreground">
                  Budget items will appear here as you track your spending
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
