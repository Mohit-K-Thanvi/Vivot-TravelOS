import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, Bookmark, Share2 } from "lucide-react";
import type { Discovery } from "@shared/schema";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: discoveries, isLoading } = useQuery<Discovery[]>({
    queryKey: ["/api/discoveries"],
  });

  const categories = [
    "all",
    "hidden-gem",
    "local-experience",
    "popular",
    "adventure",
  ];

  const filteredDiscoveries = discoveries?.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !categoryFilter || categoryFilter === "all" || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <div className="border-b border-border bg-card px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Discover Your Next Adventure
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Explore hidden gems, local experiences, and trending destinations
          </p>
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search destinations, activities, or locations..."
              className="h-12 pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-discoveries"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setCategoryFilter(category === "all" ? null : category)
              }
              data-testid={`filter-${category}`}
              className="capitalize"
            >
              {category.replace("-", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Discoveries Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        ) : filteredDiscoveries && filteredDiscoveries.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDiscoveries.map((discovery) => (
              <Card
                key={discovery.id}
                className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
                data-testid={`discovery-card-${discovery.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={discovery.imageUrl}
                    alt={discovery.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      {discovery.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-white/90">
                      <MapPin className="h-3 w-3" />
                      <span>{discovery.location}</span>
                    </div>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 backdrop-blur-sm bg-white/20"
                      data-testid={`button-bookmark-${discovery.id}`}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 backdrop-blur-sm bg-white/20"
                      data-testid={`button-share-${discovery.id}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {discovery.description}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {discovery.sentiment.replace("-", " ")}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {discovery.cost}
                    </Badge>
                    {discovery.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {discovery.rating.toFixed(1)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-add-to-trip-${discovery.id}`}
                    >
                      Add to Trip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No discoveries found</h2>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
