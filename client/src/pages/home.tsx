import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Plane,
  MapPin,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Search,
  HeartHandshake,
  Activity
} from "lucide-react";
import type { Trip, Discovery } from "@shared/schema";
import heroImage from "@assets/generated_images/hero_tropical_beach_sunset.png";
import { MoodPulse } from "@/components/mood-pulse";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Home() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Trip Planning State
  const [origin, setOrigin] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [budget, setBudget] = useState([2000]);

  const { data: trips, isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: discoveries, isLoading: discoveriesLoading } = useQuery<
    Discovery[]
  >({
    queryKey: ["/api/discoveries/featured"],
  });

  const activeTrip = trips?.find((t) => t.status === "active" || t.status === "planning");

  const createTripMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/chat/send", { content: prompt });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.trip) {
        toast({
          title: "Trip Generated!",
          description: "Your itinerary is ready.",
        });
        setLocation(`/trip/${data.trip.id}`);
      } else {
        setLocation("/chat");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start planning. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || "Current Location";
        setOrigin(city);
        toast({ title: "Location Found", description: `Set origin to ${city}` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch location name", variant: "destructive" });
      } finally {
        setIsLocating(false);
      }
    }, () => {
      toast({ title: "Error", description: "Unable to retrieve your location", variant: "destructive" });
      setIsLocating(false);
    });
  };

  const handlePlanTrip = () => {
    if (!destination) {
      toast({
        title: "Destination required",
        description: "Please enter a destination.",
        variant: "destructive",
      });
      return;
    }

    const prompt = `Plan a detailed trip from ${origin || "my current location"} to ${destination} starting ${date ? format(date, "yyyy-MM-dd") : "soon"} with a budget of $${budget[0]}. Include specific activities, coordinates, and image keywords.`;
    createTripMutation.mutate(prompt);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Mindtrip.ai Style */}
      <div className="relative h-auto md:h-[70vh] min-h-[500px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="Travel destination"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-24 md:py-0">
          <div className="w-full max-w-4xl text-center mb-8">
            <h1 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-6xl drop-shadow-lg">
              Where to next?
            </h1>
            <p className="text-base md:text-xl text-white/90 drop-shadow-md">
              Experience the world with VIVOT's adaptive travel engine.
            </p>
          </div>

          {/* Planning Widget */}
          <Card className="w-full max-w-5xl bg-transparent backdrop-blur-md shadow-2xl border border-white/60 text-white">
            <CardContent className="p-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">

                {/* ORIGIN */}
                <div className="space-y-2">
                  <Label htmlFor="origin" className="font-medium text-white text-xs md:text-sm">From</Label>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input
                      id="origin"
                      placeholder="e.g. Mumbai"
                      className="pl-9 bg-transparent border-white/40 text-white placeholder:text-white/70 text-sm md:text-base"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                    {/* Right icon inside input */}
                    <button
                      type="button"
                      onClick={handleLocationClick}
                      disabled={isLocating}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0 bg-transparent"
                    >
                      <Search
                        className={`h-4 w-4 text-white/70 ${isLocating ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                </div>

                {/* DESTINATION */}
                <div className="space-y-2">
                  <Label htmlFor="destination" className="font-medium text-white text-xs md:text-sm">To</Label>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />

                    <Input
                      id="destination"
                      placeholder="e.g. Pune"
                      className="pl-9 bg-transparent border-white/40 text-white placeholder:text-white/70 text-sm md:text-base"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>

                {/* DATE PICKER */}
                <div className="space-y-2">
                  <Label className="font-medium text-white text-xs md:text-sm">Dates</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-white/40 bg-transparent text-white text-sm md:text-base",
                          !date && "text-white/70"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white text-black rounded-md shadow-lg">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* BUDGET */}
                <div className="space-y-2">
                  <Label className="font-medium text-white text-xs md:text-sm">
                    Budget: ${budget[0]}
                  </Label>

                  <div className="pt-2 px-1">
                    <Slider
                      defaultValue={[2000]}
                      max={10000}
                      step={100}
                      value={budget}
                      onValueChange={setBudget}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* GENERATE TRIP BUTTON */}
                <div className="flex items-end">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                    onClick={handlePlanTrip}
                    disabled={createTripMutation.isPending}
                  >
                    {createTripMutation.isPending ? (
                      <span className="animate-pulse">Planning...</span>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Trip
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8 mt-8 md:-mt-20 relative z-20">

        {/* Active Trip Dashboard */}
        {activeTrip && (
          <div className="grid gap-6 md:grid-cols-[2fr_1fr] mb-12">
            <Card className="shadow-xl border-primary/10 overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur text-primary border-primary/20">
                      Live Itinerary
                    </Badge>
                    <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
                      {activeTrip.destination}
                      <span className="text-muted-foreground font-normal text-lg">
                        • {activeTrip.startDate}
                      </span>
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        toast({
                          title: "Care Mode Activated",
                          description: "We're adjusting the itinerary for individual wellness.",
                        });
                      }}
                    >
                      <HeartHandshake className="h-4 w-4 text-rose-500" />
                      Care Mode
                    </Button>
                    <Link href={`/trip/${activeTrip.id}`}>
                      <Button size="sm">View Full Plan</Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="font-semibold capitalize">{activeTrip.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Budget Used</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(activeTrip.spent / activeTrip.budget) * 100} className="w-24 h-2" />
                      <span className="font-semibold">${activeTrip.spent}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Weather</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">☀️</span>
                      <span className="font-semibold">24°C Sunny</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Silent Pulse Widget */}
            <div className="space-y-6">
              <MoodPulse tripId={activeTrip.id} />

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" className="justify-start h-auto py-2 px-3" asChild>
                    <Link href="/chat">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      AI Assistant
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start h-auto py-2 px-3" asChild>
                    <Link href="/discover">
                      <Search className="mr-2 h-4 w-4" />
                      Find Spots
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Discoveries Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">Trending Destinations</h2>
            <Link href="/discover">
              <Button variant="ghost" className="gap-1">
                View all <TrendingUp className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {discoveriesLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-[300px] w-full rounded-xl" />)
            ) : (
              discoveries?.slice(0, 3).map((discovery) => (
                <div
                  key={discovery.id}
                  className="group relative overflow-hidden rounded-xl bg-background border shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={discovery.imageUrl}
                      alt={discovery.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm md:text-lg leading-none mb-1">{discovery.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {discovery.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {discovery.sentiment}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {discovery.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
