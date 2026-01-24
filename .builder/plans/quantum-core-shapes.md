# Builder Designer Mode Connection Issue - Plan

## Problem Summary
Builder.io designer mode cannot connect to this repository because:
1. **Primary Blocker**: The Builder public API key is hardcoded as a placeholder (`"YOUR_BUILDER_PUBLIC_API_KEY"`) in `frontend/src/pages/BuilderPage.tsx:5`
2. **Secondary Blocker**: No Builder-related environment variables are configured in `frontend/.env`
3. **Potential Tertiary Issue**: Dev server reachability - the Vite server binds to `0.0.0.0:3000` but Builder's editor needs to be able to reach it (may require tunneling)

## Current State Analysis

### What's Working
- ✅ Vite is properly configured with `host: '0.0.0.0'` (allows external connections)
- ✅ `allowedHosts: true` is set (permissive for iframe embedding)
- ✅ @builder.io/react SDK is installed (`package.json` has `"@builder.io/react": "^9.1.0"`)
- ✅ Start script (`sf1.sh`) correctly launches Vite dev server on port 3000
- ✅ Vite proxies API routes properly to backend at `betaBE.aitwintech.com`

### What's Missing
- ❌ `BuilderPage.tsx` has placeholder API key: `builder.init("YOUR_BUILDER_PUBLIC_API_KEY")`
- ❌ `.env` file has no Builder-related variables (VITE_BUILDER_PUBLIC_API_KEY or similar)
- ❌ No mechanism to read Builder key from environment
- ❌ No documentation on how to configure Builder credentials locally

### Network/Reachability Considerations
- Vite dev server is bound to `0.0.0.0:3000` (good for local/remote access)
- Builder editor must be able to reach this URL for preview mode
- Options: 
  - If machine is publicly accessible: use direct URL
  - If local machine: use tunneling (ngrok, Builder's Connect, etc.)

## Recommended Solution

### Phase 1: Configure Builder API Key
1. **Add environment variable** to `frontend/.env`:
   - Use Vite convention: `VITE_BUILDER_PUBLIC_API_KEY=<your-key-here>`
   
2. **Update BuilderPage.tsx** to read from environment:
   - Replace hardcoded placeholder with: `builder.init(import.meta.env.VITE_BUILDER_PUBLIC_API_KEY || "")`
   - Add error handling for missing key

3. **Add .env.example** (optional but recommended):
   - Document the required Builder key variable for new contributors

### Phase 2: Enable Connectivity
1. **Test local dev server**:
   - Run `./sf1.sh` to start frontend
   - Verify Vite server is running on `http://localhost:3000`
   - Check that `/builder` route is accessible and BuilderComponent renders

2. **If dev server needs to be publicly accessible**:
   - Use ngrok: `ngrok http 3000` to expose local server
   - Or use Builder's built-in tunnel/Connect feature
   - Update Builder editor to use the public URL for preview

### Phase 3: Verify Connection
1. Start dev server
2. Navigate to `/builder` route
3. Open browser DevTools console
4. Confirm Builder SDK is initialized correctly (check for `builder.init()` success)
5. Test Builder preview/editor connection

## Critical Files to Modify
- **frontend/src/pages/BuilderPage.tsx** - Replace placeholder API key initialization (line 5)
- **frontend/.env** - Add `VITE_BUILDER_PUBLIC_API_KEY` variable
- **frontend/.env.example** (new) - Document required variables

## Clarifying Questions for User
Before proceeding, need to answer:
1. **Do you have a Builder.io account and a public API key?** (Required to proceed)
2. **Network accessibility**: Is the dev server meant to be publicly accessible, or should we use a local tunnel?
3. **Env variable preference**: Should we use `VITE_BUILDER_PUBLIC_API_KEY` (Vite convention) or `REACT_APP_BUILDER_PUBLIC_API_KEY` (React convention)?
4. **Error handling**: Should missing API key show an error message, or fail silently?
