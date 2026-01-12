# JOSOOR Frontend

## Overview
JOSOOR is an Agentic Enterprise Platform - a Cognitive Twin designed for national scale transformation. The frontend is built with React 18, TypeScript, and Vite.

## Project Structure
```
frontend/
├── src/
│   ├── components/       # UI components
│   │   ├── chat/         # Chat interface
│   │   ├── dashboards/   # Dashboard components
│   │   ├── ui/           # Radix UI primitives
│   │   └── content/      # Content components
│   ├── pages/            # Route pages
│   ├── lib/              # API clients (chatService, authService)
│   ├── contexts/         # React contexts (Auth, Language)
│   ├── types/            # TypeScript definitions
│   └── styles/           # CSS files
├── public/               # Static assets
│   ├── att/              # Cube animation
│   ├── knowledge/        # Twin Knowledge content
│   └── josoor_legacy/    # Legacy assets
└── vite.config.ts        # Vite configuration
```

## Running the App
The development server runs on port 5000 using Vite:
```bash
cd frontend && npm run dev
```

## Backend Connection
The frontend connects to the production backend at:
- Main API: https://betaBE.aitwintech.com/api/v1
- Graph Server: https://betaBE.aitwintech.com/api/graph

## Key Features
- Chat interface with AI assistant "Noor"
- Multi-language support (English + Arabic with RTL)
- Dashboard system (GraphDashboard, Control Tower)
- Supabase authentication
- 3D Cube animation (WebGL)

## Styling
This project uses CSS variables (theme.css) - NOT Tailwind CSS.

## Recent Changes
- January 12, 2026: Configured for Vite (previously Create React App)
- Fixed import paths from graphv001/ to dashboards/
- Updated environment variable handling for Vite compatibility
- Created missing page stubs (JosoorDashboardPage, JosoorPage, JosoorV2Page)
