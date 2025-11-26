# VIVOT - Adaptive Travel OS

An AI-powered travel planning platform that creates personalized, adaptive itineraries based on user preferences, budget, and real-time context.

## 🌟 Features

- **AI-Powered Trip Planning**: Natural language chat interface for creating personalized travel itineraries
- **Real-time Itinerary Management**: Dynamic trip planning with drag-and-drop activity scheduling
- **Budget Tracking**: Track expenses and stay within your travel budget
- **Destination Discovery**: Explore curated travel destinations and hidden gems
- **Preference Learning**: AI learns from your interactions to provide better recommendations
- **Dark/Light Theme**: Beautiful modern UI with theme switching support

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **Google Gemini AI** for conversational AI and trip generation

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Google Gemini API key**

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/GreenThenics/Vivot-TravelOS.git
cd VivotTravelOS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Google Gemini AI API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port (Optional, defaults to 5000)
PORT=5000

# Node Environment (automatically set by npm scripts)
NODE_ENV=development
```

**Important:** 
- Replace `your_gemini_api_key_here` with your actual Google Gemini API key
- Get your API key from: https://aistudio.google.com/app/apikey

### 4. Run the Application

#### For Development:

```bash
npm run dev
```

The application will start on `http://localhost:5000`

**Note:** The `npm run dev` command works on all platforms (Windows, macOS, Linux) thanks to `cross-env`.

#### For Production:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (cross-platform) |
| `npm run build` | Build for production |
| `npm start` | Start production server (cross-platform) |
| `npm run check` | Run TypeScript type checking |

## 🌐 Running on Different Machines

The project now uses `cross-env` for cross-platform compatibility, so the same commands work on all operating systems!

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or for production (after building)
npm run build
npm start
```

**Works on:** Windows, macOS, and Linux! 

**2. Missing Dependencies**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**3. API Key Issues**
- Verify your `GEMINI_API_KEY` is correctly set in `.env`
- Check API key has proper permissions
- Ensure no extra spaces in the `.env` file

## 📂 Project Structure

```
VivotTravelOS/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   └── home.tsx      # Entry point
│   └── index.html
├── server/                # Backend Express server
│   ├── app.ts           # Express app configuration
│   ├── routes.ts        # API routes
│   ├── gemini-service.ts # AI service integration
│   ├── storage.ts       # Database operations
│   ├── index-dev.ts     # Development entry point
│   └── index-prod.ts    # Production entry point
├── shared/              # Shared types and schemas
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🔐 Security Notes

- **Never commit `.env` file** - It contains sensitive API keys
- The `.env` file is already added to `.gitignore`
- Keep your API keys secure and rotate them regularly
- Use environment-specific `.env` files for different deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Quick Start Guide

For the fastest way to get started:

1. Clone the repo
2. Run `npm install`
3. Create `.env` with your `GEMINI_API_KEY`
4. Run `npm run dev` (works on all platforms!)
5. Open `http://localhost:5000` in your browser

Happy traveling! 🌍✈️
