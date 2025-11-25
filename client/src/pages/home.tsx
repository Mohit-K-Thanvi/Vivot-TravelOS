import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { Trip, Discovery } from "@shared/schema";
import heroImage from "@assets/generated_images/hero_tropical_beach_sunset.png";

export default function Home() {
  const { data: trips, isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: discoveries, isLoading: discoveriesLoading } = useQuery<
    Discovery[]
  >({
    queryKey: ["/api/discoveries/featured"],
  });

  const activeTrip = trips?.find((t) => t.status === "active" || t.status === "planning");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="Travel destination"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Your Intelligent Travel Companion
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
            VIVOT adapts to your preferences, budget, and location in real-time—creating
            personalized travel experiences that evolve with you
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/chat">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground border border-primary-border hover-elevate active-elevate-2"
                data-testid="button-start-planning"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Start Planning with AI
              </Button>
            </Link>
            <Link href="/discover">
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
                data-testid="button-discover"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Discover Destinations
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        {/* Active Trip Summary */}
        {activeTrip && (
          <Card className="mb-8" data-testid="card-active-trip">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl">Your Active Trip</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {activeTrip.destination}
                </p>
              </div>
              <Badge variant="default" data-testid="badge-trip-status">
                {activeTrip.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dates</p>
                    <p className="text-xs text-muted-foreground">
                      {activeTrip.startDate} - {activeTrip.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-xs text-muted-foreground">
                      ${activeTrip.spent.toFixed(0)} / ${activeTrip.budget.toFixed(0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <Link href={`/trip/${activeTrip.id}`}>
                    <Button size="sm" data-testid="button-view-itinerary">
                      View Itinerary
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget spent</span>
                  <span className="font-medium">
                    {((activeTrip.spent / activeTrip.budget) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={(activeTrip.spent / activeTrip.budget) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Your Trips */}
          <Card data-testid="card-your-trips">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Your Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : trips && trips.length > 0 ? (
                <div className="space-y-3">
                  {trips.slice(0, 3).map((trip) => (
                    <Link key={trip.id} href={`/trip/${trip.id}`}>
                      <div
                        className="flex items-center gap-3 rounded-lg border border-border p-3 hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`trip-${trip.id}`}
                      >
                        {trip.imageUrl && (
                          <img
                            src={trip.imageUrl}
                            alt={trip.destination}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{trip.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {trip.startDate}
                          </p>
                        </div>
                        <Badge variant="secondary">{trip.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    No trips yet. Start planning your adventure!
                  </p>
                  <Link href="/chat">
                    <Button size="sm" data-testid="button-create-trip">
                      Create Trip
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card data-testid="card-budget">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTrip ? (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        ${activeTrip.spent.toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of ${activeTrip.budget.toFixed(0)}
                      </span>
                    </div>
                    <Progress
                      value={(activeTrip.spent / activeTrip.budget) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium">
                        ${(activeTrip.budget - activeTrip.spent).toFixed(0)}
                      </span>
                    </div>
                    <Link href={`/trip/${activeTrip.id}/budget`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        data-testid="button-view-budget"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No active trip to track
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Discoveries */}
          <Card data-testid="card-discoveries">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discoveriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : discoveries && discoveries.length > 0 ? (
                <div className="space-y-3">
                  {discoveries.slice(0, 3).map((discovery) => (
                    <div
                      key={discovery.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover-elevate"
                      data-testid={`discovery-${discovery.id}`}
                    >
                      <img
                        src={discovery.imageUrl}
                        alt={discovery.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {discovery.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {discovery.location}
                        </p>
                      </div>
                      <Badge variant="secondary">{discovery.sentiment}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Loading discoveries...
                  </p>
                </div>
              )}
              <Link href="/discover">
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  data-testid="button-explore-more"
                >
                  Explore More
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
