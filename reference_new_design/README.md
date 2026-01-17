# KSA Water Sector Command Center

A comprehensive React-based dashboard for monitoring and managing the Kingdom of Saudi Arabia's water sector infrastructure and strategic initiatives.

## Features

### 🗺️ Interactive Saudi Arabia Map
- Real-time visualization of water plants across KSA
- Plant status indicators (Operational, Planned, At-Risk)
- Toggle to show/hide future planned facilities
- Zoom and pan capabilities for detailed inspection
- Click on plants to view detailed information

### 📊 Strategic Impact Dashboard
- Real-time radar chart showing 5 key strategic metrics:
  - GDP Impact
  - Jobs Created
  - FDI Attracted
  - Infrastructure Development
  - Capacity Growth
- Gauge-style KPI cards with historical and projected values
- Visual performance indicators with color-coded statuses

### 🏥 Transformation Health Monitoring
- Comprehensive radar chart with 8 transformation indicators:
  - Project Delivery
  - Operations Efficiency
  - Investment Health
  - Partnerships
  - Infrastructure Coverage
  - Economic Impact
  - Regional Coverage
  - Community Engagement
- Insight cards showing key health metrics

### 🎨 Modern UI/UX
- Dark theme with professional color scheme
- Glassmorphism effects and smooth transitions
- Custom scrollbars
- Responsive layout
- Real-time data visualization using ECharts

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ECharts** - Data visualization
- **echarts-for-react** - React integration for charts
- **Lucide React** - Icon library
- **Vite** - Build tool

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── NavigationSidebar.tsx    # Left navigation panel
│   │   ├── DashboardSidebar.tsx     # Middle dashboard with tabs
│   │   ├── SaudiMap.tsx             # Interactive map component
│   │   └── GaugeCard.tsx            # Reusable gauge visualization
│   ├── data/
│   │   └── ksaData.ts               # Water sector data & GeoJSON
│   └── App.tsx                       # Main application component
└── styles/
    ├── index.css                     # Global styles
    ├── theme.css                     # Theme variables
    └── fonts.css                     # Font imports
```

## Key Components

### NavigationSidebar
- Branding and system information
- Navigation menu (Command Center, Engine Room, Diagnostic Lab)
- User profile section

### DashboardSidebar
- Tab switching between Strategic Impact and Transform Health
- Radar charts for comprehensive metrics visualization
- KPI cards with gauge-style progress indicators

### SaudiMap
- ECharts-powered geographic visualization
- Plant markers with status-based coloring
- Interactive tooltips and details panel
- Map controls (zoom, pan, toggle future plans)
- Legend for plant status types

### GaugeCard
- Semi-circular gauge visualization
- Shows actual value vs. targets
- Historical and projected performance
- Color-coded status indicators

## Data Structure

The application uses comprehensive data about KSA's water infrastructure:
- 13 Administrative Regions
- 7 Major Water Plants (with more planned)
- Strategic objectives (L1 and L2)
- Transformation health metrics
- Real-time capacity and performance data

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features Highlights

✅ **Real-time Monitoring** - Track water infrastructure performance across the kingdom
✅ **Strategic Planning** - Visualize long-term goals and current progress
✅ **Interactive Maps** - Explore facilities geographically
✅ **Data-Driven Insights** - Make informed decisions based on comprehensive metrics
✅ **Responsive Design** - Works seamlessly across different screen sizes
✅ **Professional UI** - Modern, clean interface with attention to detail

## Color Scheme

- **Primary Background**: `#111827` (Dark slate)
- **Panel Background**: `#1F2937` (Slate gray)
- **Success/Operational**: `#10B981` (Emerald green)
- **Warning/Amber**: `#F59E0B` (Amber orange)
- **Danger/At-Risk**: `#EF4444` (Red)
- **Accent**: `#FFD700` (Gold)

## Future Enhancements

- Real-time data integration via APIs
- Historical trend analysis
- Predictive analytics
- Export and reporting features
- Multi-language support (English/Arabic)
- Advanced filtering and search capabilities

---

Built with ❤️ for the Kingdom of Saudi Arabia's Water Sector
