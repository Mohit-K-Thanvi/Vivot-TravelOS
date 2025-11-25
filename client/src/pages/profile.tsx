import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, TrendingUp, Heart, Utensils } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserPreferences, Trip } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);

  const { data: preferences, isLoading: prefsLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const { data: trips } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const [formData, setFormData] = useState<Partial<UserPreferences>>(preferences || {});

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      return await apiRequest("PATCH", "/api/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      setEditMode(false);
      toast({
        title: "Preferences Updated",
        description: "Your travel preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  const travelStats = {
    totalTrips: trips?.length || 0,
    completedTrips: trips?.filter((t) => t.status === "completed").length || 0,
    activeTrips: trips?.filter((t) => t.status === "active").length || 0,
    totalSpent: trips?.reduce((sum, t) => sum + t.spent, 0) || 0,
  };

  const interestOptions = [
    "food",
    "adventure",
    "culture",
    "nature",
    "shopping",
    "nightlife",
    "art",
    "history",
  ];

  const dietaryOptions = ["none", "vegetarian", "vegan", "halal", "kosher", "gluten-free"];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Travel Profile</h1>
              <p className="text-muted-foreground">
                Your preferences help us create perfect itineraries
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Travel Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trips</p>
                  <p className="text-2xl font-bold">{travelStats.totalTrips}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{travelStats.completedTrips}</p>
                </div>
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{travelStats.activeTrips}</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${travelStats.totalSpent.toFixed(0)}</p>
                </div>
                <Utensils className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Travel Preferences</CardTitle>
              {!editMode ? (
                <Button
                  onClick={() => {
                    setFormData(preferences || {});
                    setEditMode(true);
                  }}
                  data-testid="button-edit-preferences"
                >
                  Edit Preferences
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updatePreferencesMutation.isPending}
                    data-testid="button-save-preferences"
                  >
                    {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {prefsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  {editMode ? (
                    <Select
                      value={formData.budget || preferences?.budget}
                      onValueChange={(value) => setFormData({ ...formData, budget: value })}
                    >
                      <SelectTrigger id="budget" data-testid="select-budget">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Budget-Friendly</SelectItem>
                        <SelectItem value="medium">Moderate</SelectItem>
                        <SelectItem value="high">Comfortable</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 capitalize text-muted-foreground">
                      {preferences?.budget || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pace">Travel Pace</Label>
                  {editMode ? (
                    <Select
                      value={formData.pace || preferences?.pace}
                      onValueChange={(value) => setFormData({ ...formData, pace: value })}
                    >
                      <SelectTrigger id="pace" data-testid="select-pace">
                        <SelectValue placeholder="Select pace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relaxed">Relaxed</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="fast-paced">Fast-Paced</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 capitalize text-muted-foreground">
                      {preferences?.pace || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="travelStyle">Travel Style</Label>
                  {editMode ? (
                    <Select
                      value={formData.travelStyle || preferences?.travelStyle}
                      onValueChange={(value) => setFormData({ ...formData, travelStyle: value })}
                    >
                      <SelectTrigger id="travelStyle" data-testid="select-travel-style">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo Traveler</SelectItem>
                        <SelectItem value="couple">Couple</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 capitalize text-muted-foreground">
                      {preferences?.travelStyle || "Not set"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Interests</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editMode ? (
                      interestOptions.map((interest) => {
                        const isSelected = (formData.interests || preferences?.interests || []).includes(
                          interest
                        );
                        return (
                          <Badge
                            key={interest}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer capitalize hover-elevate"
                            onClick={() => {
                              const current = formData.interests || preferences?.interests || [];
                              const updated = isSelected
                                ? current.filter((i) => i !== interest)
                                : [...current, interest];
                              setFormData({ ...formData, interests: updated });
                            }}
                            data-testid={`badge-interest-${interest}`}
                          >
                            {interest}
                          </Badge>
                        );
                      })
                    ) : preferences?.interests && preferences.interests.length > 0 ? (
                      preferences.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="capitalize">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No interests selected</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Dietary Restrictions</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editMode ? (
                      dietaryOptions.map((dietary) => {
                        const isSelected = (formData.dietary || preferences?.dietary || []).includes(
                          dietary
                        );
                        return (
                          <Badge
                            key={dietary}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer capitalize hover-elevate"
                            onClick={() => {
                              const current = formData.dietary || preferences?.dietary || [];
                              const updated = isSelected
                                ? current.filter((d) => d !== dietary)
                                : [...current, dietary];
                              setFormData({ ...formData, dietary: updated });
                            }}
                            data-testid={`badge-dietary-${dietary}`}
                          >
                            {dietary}
                          </Badge>
                        );
                      })
                    ) : preferences?.dietary && preferences.dietary.length > 0 ? (
                      preferences.dietary.map((dietary) => (
                        <Badge key={dietary} variant="secondary" className="capitalize">
                          {dietary}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No dietary restrictions</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Trips */}
        {trips && trips.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Past Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trips
                  .filter((t) => t.status === "completed")
                  .map((trip) => (
                    <div
                      key={trip.id}
                      className="group overflow-hidden rounded-lg border border-border hover-elevate"
                      data-testid={`past-trip-${trip.id}`}
                    >
                      {trip.imageUrl && (
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={trip.imageUrl}
                            alt={trip.destination}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold">{trip.destination}</h3>
                        <p className="text-xs text-muted-foreground">
                          {trip.startDate} - {trip.endDate}
                        </p>
                        <p className="mt-2 text-sm">
                          Spent: ${trip.spent.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
