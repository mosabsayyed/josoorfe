---
description: How to access the Sector Desk for testing (bypasses auth)
---

# Testing the Sector Desk

## Direct Route (Bypasses Auth)
To test the Sector Command Center dashboard without logging in:

```
http://localhost:3000/desk/sector
```

## Dev Server
The frontend dev server runs on port 3000 by default:
```bash
cd /home/mosab/projects/josoorfe/frontend
npm run dev
```

## Key Components
- **SectorDesk.tsx** - Main dashboard component
- **SectorHeaderNav.tsx** - Top header with filters and policy tools display
- **SectorMap.tsx** - Interactive map component
- **SectorDetailsPanel.tsx** - Right panel for asset details

## API Endpoint for Policy Tools
```bash
curl -s "https://betaBE.aitwintech.com/api/graph?nodeLabels=SectorPolicyTool"
```
