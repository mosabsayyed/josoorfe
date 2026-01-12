# JOSOOR Frontend Integration Guide

## 📦 Package Contents

You have received the JOSOOR frontend in two parts:
- **josoor-frontend-part1.zip** (28MB) - Source code, configs, large assets (cube, legacy)
- **josoor-frontend-part2.zip** (18MB) - Twin Knowledge content, icons, architecture assets

## 🚀 Quick Start

### Step 1: Extract Both Archives

```bash
# Extract to the same location - they will merge automatically
unzip josoor-frontend-part1.zip
unzip josoor-frontend-part2.zip
```

Both archives maintain the same folder structure and will combine seamlessly into:
```
josoor-frontend/
├── frontend/
│   ├── src/              (from part1)
│   ├── public/
│   │   ├── att/          (from part1 - 22MB cube animation)
│   │   ├── josoor_legacy/ (from part1 - 11MB)
│   │   ├── knowledge/    (from part2 - 19MB Twin Knowledge)
│   │   ├── icons/        (from part2)
│   │   ├── architecture/ (from part2)
│   │   └── ...
│   ├── package.json      (from part1)
│   └── .env              (from part1)
├── docs/
├── README.md
└── start.sh
```

### Step 2: Install Dependencies

```bash
cd josoor-frontend/frontend
npm install
```

**Expected duration:** 2-3 minutes  
**Dependencies:** ~1,400 packages (React 19, TypeScript, Vite, Radix UI, etc.)

### Step 3: Configure Backend Connection

The frontend is **pre-configured** to connect to the production backend:

**Backend URL:** `https://betaBE.aitwintech.com`

This is already set in:
- `frontend/.env` → `REACT_APP_API_URL=https://betaBE.aitwintech.com/api/v1`
- `frontend/src/setupProxy.js` → Proxies configured for SSL backend

**No changes needed unless you want to use a different backend.**

### Step 4: Start Development Server

```bash
# Option 1: Using the provided script (recommended)
cd josoor-frontend
./start.sh

# Option 2: Manual start
cd josoor-frontend/frontend
npm start
```

**Frontend will open at:** `http://localhost:3000`

---

## 🔧 Backend Integration Details

### Production Backend (betaBE.aitwintech.com)

**Protocol:** HTTPS with SSL (via Caddy reverse proxy)

**Endpoints:**
- Main Backend: `https://betaBE.aitwintech.com/api/v1/*` (FastAPI on port 8008)
- Graph Server: `https://betaBE.aitwintech.com/api/graph/*` (Express on port 3001)
- Neo4j API: `https://betaBE.aitwintech.com/api/neo4j/*`
- MCP Servers: `/1/mcp/`, `/2/mcp/`, `/3/mcp/`, `/4/mcp/` (obscured endpoints)

**CORS:** Already configured for `localhost:3000` and `localhost:5173`

### Proxy Configuration

The frontend uses Vite's proxy to route API requests:

**File:** `frontend/src/setupProxy.js`

```javascript
// Graph server routes → port 3001
'/api/neo4j/*', '/api/graph/*', '/api/dashboard/*', 
'/api/business-chain/*', '/api/control-tower/*', etc.

// Main backend routes → port 8008
'/api/v1/*' (catch-all)
```

### Environment Variables

**File:** `frontend/.env`

```env
REACT_APP_API_URL=https://betaBE.aitwintech.com/api/v1
REACT_APP_SUPABASE_URL=https://ojlfhkrobyqmifqbgcyw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**To change backend:** Edit `REACT_APP_API_URL` to your backend URL.

---

## 🎯 Key Features Included

### ✅ Application Code (3.3MB)
- React 19 with TypeScript
- Vite build system
- Radix UI components (40+ primitives)
- Chat interface with artifact rendering
- Dashboard system (GraphDashboard, Control Tower, etc.)
- Multi-language support (English + Arabic with RTL)

### ✅ Twin Knowledge System (19MB)
- **HTML Episodes:** 1.1-4.4 (English + Arabic)
- **Images:** Diagrams, screenshots for all episodes (122MB before cleanup)
- **Note:** Video/audio files excluded (use YouTube integration later)

### ✅ Cube Animation (22MB)
- 3D Rubik's Cube experience
- Three.js powered
- Custom face textures
- Located in `public/att/cube/`

### ✅ Legacy Assets (11MB)
- Original JOSOOR landing pages
- Scenario mockups
- Ontology visualizations
- Located in `public/josoor_legacy/`

---

## 📂 Directory Structure

```
josoor-frontend/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # Chat interface
│   │   │   ├── dashboards/     # Dashboard components (clean structure)
│   │   │   ├── ui/             # Radix UI primitives
│   │   │   └── content/        # Content components
│   │   ├── pages/              # Route pages
│   │   │   ├── ChatAppPage.tsx
│   │   │   ├── josoor-sandbox/ # Sandbox frame with desks
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── services/       # API clients (chatService, authService)
│   │   │   └── api/            # Graph API client
│   │   ├── types/              # TypeScript definitions
│   │   ├── styles/             # CSS files (theme.css, etc.)
│   │   ├── contexts/           # React contexts (Auth, Language)
│   │   └── data/               # Static data, constants
│   ├── public/
│   │   ├── knowledge/          # Twin Knowledge (19MB)
│   │   ├── att/                # Cube + landing (22MB)
│   │   ├── josoor_legacy/      # Legacy assets (11MB)
│   │   ├── icons/              # Sidebar icons
│   │   └── architecture/       # Architecture content
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── setupProxy.js
├── docs/
│   └── FRONTEND_ARCHITECTURE.md  # Complete architecture reference
├── README.md
├── start.sh                       # Quick start script
└── EXTERNAL_BACKEND_SETUP.md      # Backend integration details
```

---

## 🎨 Styling System

**⚠️ CRITICAL: This project does NOT use Tailwind CSS**

- **CSS Variables:** All styles use CSS custom properties from `theme.css`
- **Component CSS:** Dedicated CSS files (e.g., `ChatAppPage.css`, `sidebar.css`)
- **Theme Support:** Dark/light themes via `data-theme` attribute

**File:** `frontend/src/styles/theme.css`

```css
:root {
  --component-bg-primary: #111827;
  --component-text-primary: #F9FAFB;
  --component-text-accent: #FFD700;
  /* ... */
}
```

---

## 🔐 Authentication

**Provider:** Supabase Auth + Local JWT

**Modes:**
1. **Full Authentication:** Login with email/password
2. **Guest Mode:** Local storage persistence (no backend account)

**Implementation:**
- `AuthContext.tsx` manages auth state
- `authService.ts` handles Supabase operations
- JWT tokens stored in localStorage (`josoor_token`, `josoor_user`)

---

## 🌐 Internationalization (i18n)

**Languages:** English (en) + Arabic (ar)

**Features:**
- RTL support for Arabic
- Language toggle component
- Translation files in `src/locales/`

**Usage:**
```typescript
const { language, setLanguage, isRTL } = useLanguage();
```

---

## 🧪 Testing

```bash
# Run tests
cd frontend
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚨 Troubleshooting

### Issue: Backend connection fails

**Check:**
1. Backend is running at `https://betaBE.aitwintech.com`
2. Test health endpoint: `curl https://betaBE.aitwintech.com/api/v1/health`
3. CORS is configured for your frontend origin

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### Issue: Dependencies fail to install

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Twin Knowledge episodes not loading

**Check:**
1. Both zip files were extracted to the same location
2. `frontend/public/knowledge/` directory exists
3. HTML files exist: `1.1.html`, `1.2.html`, etc.

---

## 📋 Pre-Deployment Checklist

- [ ] Both zip files extracted successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Backend URL configured in `.env`
- [ ] Dev server starts without errors (`npm start`)
- [ ] Login/auth works (or guest mode)
- [ ] Chat interface loads
- [ ] Twin Knowledge episodes accessible
- [ ] Dashboards render (GraphDashboard, Control Tower)
- [ ] Build succeeds (`npm run build`)

---

## 🔗 Backend Repository

**Backend Code:** https://github.com/mosabsayyed/josoorbe.git

**Note:** MCP server directory must be manually transferred to VPS and placed in `josoorbe/backend/mcp-server/`

---

## 📚 Additional Documentation

- **Frontend Architecture:** `docs/FRONTEND_ARCHITECTURE.md` (comprehensive reference)
- **Backend Setup:** `EXTERNAL_BACKEND_SETUP.md` (production backend details)
- **Quick Start:** `00_START_HERE.md` (overview)
- **Main README:** `README.md` (project overview)

---

## 💡 Development Tips

1. **Hot Reload:** Vite provides instant hot module replacement - no need to restart
2. **CSS Variables:** Always use `var(--component-*)` instead of hardcoded colors
3. **Clean Structure:** Dashboard components use `dashboards/` (not `graphv001/`)
4. **API Calls:** Use `chatService.ts` and `authService.ts` - don't call fetch directly
5. **Types:** All types in `src/types/` - import from there

---

## 🎯 Next Steps

1. Extract both zip files to your target location
2. Run `npm install` in `frontend/` directory
3. Start dev server with `npm start` or `./start.sh`
4. Test chat interface and Twin Knowledge
5. Deploy to production when ready

**Questions?** Check `FRONTEND_ARCHITECTURE.md` for detailed component/API documentation.

---

*Generated: January 12, 2026*  
*Frontend Size: 59MB (uncompressed) / 46MB (compressed)*  
*Backend: https://betaBE.aitwintech.com*
