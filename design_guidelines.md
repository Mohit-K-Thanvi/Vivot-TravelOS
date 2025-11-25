# VIVOT–Adaptive Travel OS: Design Guidelines

## Design Approach: Reference-Based Hybrid
**Primary Inspiration:** Airbnb (travel discovery) + Linear (modern interface) + Google Maps (location context)
**Design Principle:** Create an intelligent, adaptive travel companion that feels personal, trustworthy, and effortlessly intuitive.

---

## Typography System

**Primary Font:** Inter (via Google Fonts CDN)
**Secondary Font:** Manrope (for headings)

**Hierarchy:**
- Hero Headlines: 3xl to 5xl, font-bold, tracking-tight
- Section Titles: 2xl to 3xl, font-semibold
- Card Titles: lg to xl, font-semibold
- Body Text: base, font-normal, leading-relaxed
- Metadata/Labels: sm, font-medium, tracking-wide, uppercase

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 consistently
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20 (desktop), py-8 to py-12 (mobile)
- Card gaps: gap-4 to gap-6
- Element margins: m-2, m-4, m-8

**Container Strategy:**
- App shell: max-w-7xl mx-auto
- Content sections: max-w-6xl
- Forms/Chat: max-w-3xl
- Cards: Full width within grid constraints

---

## Core Components

### Navigation
- Sticky top navigation with backdrop blur
- Mobile: Bottom tab bar (Home, Discover, Trips, Profile) with icons
- Desktop: Horizontal nav with user avatar, notifications bell, search bar

### Conversational AI Interface
- Chat-style message bubbles (user right, AI left)
- Floating input bar at bottom with microphone icon
- Smooth scroll-to-bottom on new messages
- Typing indicators with animated dots

### Itinerary Cards
- Timeline-style layout with connecting lines (vertical on mobile, horizontal option on desktop)
- Each card: Image thumbnail, title, time, location pin, budget indicator
- Drag-to-reorder functionality (visual handle on left)
- Expandable details panel with smooth height transition

### Discovery Feed
- Masonry grid layout (1 col mobile, 2-3 cols desktop)
- Cards with large images, overlaid gradient for text readability
- Quick-action icons: Save, Share, Add to Trip
- Sentiment badges (e.g., "Highly Rated," "Hidden Gem")

### Interactive Map
- Full-height map view option
- Clustered markers with custom pin icons
- Bottom sheet panel (slides up) showing selected location details
- Route visualization with multi-modal transit options

### Dashboard Cards
- Grid layout: 2 cols on tablet+, 1 col mobile
- Stat cards: Large number, small label, mini trend graph
- Budget tracker: Progress bar with color zones
- Profile insights: Circular charts, tag clouds for interests

### Budget Tracker
- Horizontal category breakdown with segment bars
- Daily spending timeline graph
- Alert banners for overspending (subtle, inline)

---

## Visual Patterns

**Card Design:**
- Rounded corners: rounded-xl to rounded-2xl
- Subtle shadows: shadow-sm to shadow-md
- Borders: border border-gray-200 (light mode thinking)
- Hover: slight lift with shadow-lg transition

**Gradients:**
- Use sparingly for hero sections and CTAs
- Diagonal gradients from top-left to bottom-right
- Overlay gradients on hero images for text legibility

**Icons:**
- Heroicons (via CDN) throughout
- Consistent 20px/24px sizing for inline icons
- 32px/40px for feature highlights

---

## Page Structures

### Home/Dashboard
- Quick-access AI chat widget (floating bottom-right)
- Active trip summary card at top
- 3-column grid: Upcoming activities, Budget status, Suggested discoveries
- Recent search history with thumbnail previews

### Itinerary Builder
- Split view: Timeline left (or top on mobile), map right (or bottom)
- Day selector tabs above timeline
- Add activity FAB button
- Real-time budget counter in sticky header

### Discovery Page
- Hero: Search bar with smart filters (Budget, Vibe, Time)
- Masonry feed below
- Infinite scroll loading pattern
- Filter chips: Sticky under search bar

### Profile/Settings
- Large avatar with travel stats banner
- Preference cards: Organized by category (Food, Activity Pace, Interests)
- Past trips gallery with memory highlights
- Settings accordion panels

---

## Images

**Hero Image (Home/Landing):**
- Placement: Full-width hero section, 60-80vh
- Description: Stunning travel destination landscape (e.g., sunset over coastal cliffs, vibrant city skyline, serene mountain lake)
- Treatment: Subtle gradient overlay (dark at bottom) for text contrast
- Buttons: Frosted glass effect (backdrop-blur) with semi-transparent background

**Discovery Feed Images:**
- Aspect ratio: 4:3 for consistency
- Overlays: Bottom gradient for location/title text

**Itinerary Cards:**
- Small thumbnails: 80px × 80px, rounded-lg

**Profile Header:**
- Cover photo option (16:9, subtle parallax on scroll)

---

## Interaction Patterns

**Animations:** Minimal and purposeful
- Page transitions: Subtle fade-in
- Card reveals: Stagger animation on scroll into view
- Loading states: Skeleton screens (not spinners)
- No scroll-triggered parallax effects

**Micro-interactions:**
- Button press: Scale down slightly (scale-95)
- Card hover: Lift and shadow increase
- Toggle switches: Smooth slide animation

**Mobile Gestures:**
- Swipe-to-delete on itinerary items
- Pull-to-refresh on feed
- Pinch-to-zoom on map (native behavior)

---

## Accessibility

- Minimum touch targets: 44px × 44px
- Focus states: Ring with offset for all interactive elements
- ARIA labels on icon-only buttons
- Semantic HTML structure throughout
- High contrast text on image overlays

---

This design system creates a premium, intelligent travel experience that feels both powerful and approachable—balancing AI sophistication with human-centered simplicity.