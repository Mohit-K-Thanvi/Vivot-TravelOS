# VIVOT - Adaptive Travel OS

## Overview

VIVOT is an AI-powered travel planning platform that creates personalized, adaptive itineraries based on user preferences, budget, and real-time context. The application functions as an "intelligent travel companion" that learns from user interactions and adjusts recommendations accordingly. It combines conversational AI interfaces with traditional travel planning tools to deliver a seamless trip planning and discovery experience.

The platform features trip creation through natural language chat, real-time itinerary management, budget tracking, destination discovery, and user preference learning. The design philosophy draws inspiration from Airbnb's travel discovery patterns, Linear's modern interface aesthetics, and Google Maps' location-aware context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter library for lightweight client-side routing. Main routes include:
- Home dashboard (`/`)
- AI Chat interface (`/chat`)
- Discovery page (`/discover`)
- Trip detail view (`/trip/:id`)
- User profile/preferences (`/profile`)

**State Management**: TanStack Query (React Query) for server state management, with a centralized query client. No global client state library - component state is managed locally with React hooks.

**UI Components**: shadcn/ui component library built on Radix UI primitives, providing accessible, customizable components. All components use the "new-york" style variant with Tailwind CSS for styling.

**Design System**: 
- Typography uses Inter (primary) and Manrope (headings) from Google Fonts
- Color system based on CSS custom properties supporting light/dark themes
- Spacing follows Tailwind's scale (2, 4, 6, 8, 12, 16, 20 units)
- Custom elevation system using subtle shadows and overlays
- Border radius system: lg (9px), md (6px), sm (3px)

**Theme System**: Custom theme provider supporting light/dark modes with localStorage persistence. Theme toggle available in header.

### Backend Architecture

**Framework**: Express.js server with TypeScript in ESM module format.

**Development vs Production**:
- Development mode uses Vite middleware for HMR and serves from source
- Production mode serves pre-built static assets from `dist/public`
- Separate entry points: `index-dev.ts` and `index-prod.ts`

**API Structure**: RESTful API with the following main endpoint groups:
- `/api/preferences` - User preference management (GET, PATCH)
- `/api/trips` - Trip CRUD operations
- `/api/trips/:id/activities` - Activity management per trip
- `/api/trips/:id/budget` - Budget tracking per trip
- `/api/chat/messages` - Chat history retrieval
- `/api/chat/send` - AI conversation and trip generation
- `/api/discoveries` - Travel destination discovery

**Storage Layer**: Abstracted storage interface (`IStorage`) allowing for different implementations. Currently designed for in-memory or database-backed storage with methods for Users, Preferences, Trips, Activities, Discoveries, Budget Items, Chat Messages, and Journey Options.

**AI Integration**: OpenAI integration (GPT-5 model) for:
- Natural language trip planning requests
- Itinerary generation with structured JSON responses
- Real-time itinerary adaptation based on user feedback
- Preference learning from conversations

### Data Architecture

**ORM**: Drizzle ORM configured for PostgreSQL with schema-first approach.

**Database Schema** (defined in `shared/schema.ts`):

1. **User Preferences Table**
   - Stores AI learning data: budget level, pace, interests, dietary restrictions, travel style
   - Default user ID: "default-user" (single-user application pattern)

2. **Trips Table**
   - Core trip data: destination, dates, budget, spent amount, status
   - Status states: planning, active, completed
   - Includes optional image URL

3. **Activities Table**
   - Itinerary items linked to trips
   - Categorized (activity, restaurant, accommodation, transport)
   - Includes day number, time, duration, location, cost
   - Ordered by `orderIndex`, with completion tracking

4. **Discoveries Table**
   - Curated travel destinations and experiences
   - Categorized (hidden-gem, local-experience, popular, adventure)
   - Featured flag for homepage display

5. **Budget Items Table**
   - Granular expense tracking per trip
   - Categories: accommodation, food, transport, activities, other

6. **Chat Messages Table**
   - Conversation history with AI
   - Role-based (user/assistant) with timestamp

7. **Journey Options Table**
   - Alternative travel recommendations
   - Stores pricing, duration, transport type

**Schema Validation**: Zod schemas generated from Drizzle tables using `drizzle-zod` for runtime validation.

**Data Flow**: 
1. Client makes API request
2. Express route validates input using Zod schemas
3. Storage layer performs database operations via Drizzle
4. Response formatted and returned to client
5. React Query caches and provides to components

### External Dependencies

**Database**: 
- PostgreSQL (via Neon serverless driver `@neondatabase/serverless`)
- Connection managed through `DATABASE_URL` environment variable
- Migration support via Drizzle Kit

**AI Service**:
- OpenAI API (GPT-5 model)
- Requires `OPENAI_API_KEY` environment variable
- Used for trip generation and conversational interactions

**Session Management**:
- `connect-pg-simple` for PostgreSQL-backed sessions
- Express session middleware for user state

**Development Tools**:
- Replit-specific plugins for development experience (cartographer, dev banner, runtime error overlay)
- Only loaded in development environment when `REPL_ID` is present

**Build & Development**:
- Vite for frontend bundling and dev server
- esbuild for backend production bundling
- TypeScript for type safety across stack
- PostCSS with Tailwind CSS and Autoprefixer

**Fonts**:
- Google Fonts CDN for Inter and Manrope typefaces
- Preconnect hints for performance optimization

**Third-party UI Libraries**:
- Radix UI primitives for accessible components
- embla-carousel-react for carousels
- react-day-picker for date selection
- cmdk for command palette
- vaul for drawer component
- recharts for data visualization (chart components)
- lucide-react for icon system

**Utilities**:
- date-fns for date manipulation
- clsx and tailwind-merge (via cn utility) for conditional className handling
- class-variance-authority for variant-based component APIs
- nanoid for unique ID generation