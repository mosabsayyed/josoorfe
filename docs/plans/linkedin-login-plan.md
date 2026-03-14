# Plan: Add LinkedIn Login

## Context
Add LinkedIn as a login option alongside Google. Currently uses Supabase OAuth. Two parts: dashboard config + small code changes.

---

## Part 1: LinkedIn Developer Portal (browser steps)

### Step 1 — Go to LinkedIn Developer Portal
- URL: `https://www.linkedin.com/developers/apps`
- Sign in with your LinkedIn account

### Step 2 — Create a New App
- Click **"Create app"**
- Fill in:
  - **App name:** `Josoor`
  - **LinkedIn Page:** Select your company page (or create one if needed — LinkedIn requires a company page to create an app)
  - **Privacy policy URL:** `https://josoor.com/privacy` (or your actual privacy page)
  - **App logo:** Upload the Josoor logo
- Click **"Create app"**

### Step 3 — Request the OpenID Connect Product
- Go to the **"Products"** tab of your new app
- Find **"Sign In with LinkedIn using OpenID Connect"**
- Click **"Request access"**
- Accept the terms — it should be approved instantly

### Step 4 — Get Client ID and Secret
- Go to the **"Auth"** tab
- Copy the **Client ID** (you'll need it for Supabase)
- Click **"Generate"** or reveal the **Client Secret** (you'll need it for Supabase)
- **Save both values** somewhere safe

### Step 5 — Add Redirect URI
- Still on the **"Auth"** tab, scroll to **"Authorized redirect URLs for your app"**
- Click **"Add redirect URL"**
- Paste this exact URL:
  ```
  https://ojlfhkrobyqmifqbgcyw.supabase.co/auth/v1/callback
  ```
- Click **"Update"** / **"Save"**

---

## Part 2: Supabase Dashboard (browser steps)

### Step 6 — Open Supabase Auth Providers
- URL: `https://supabase.com/dashboard/project/ojlfhkrobyqmifqbgcyw/auth/providers`
- Sign in if needed

### Step 7 — Enable LinkedIn OIDC
- Scroll down the providers list to find **"LinkedIn (OIDC)"**
- Click to expand it
- Toggle **"Enable Sign in with LinkedIn (OIDC)"** to ON
- Paste the **Client ID** from Step 4
- Paste the **Client Secret** from Step 4
- Click **"Save"**

---

## Part 3: Code Changes (I will do this)

### File 1: `frontend/src/services/authService.ts` (line 54)
Add `'linkedin_oidc'` to the provider type union.

### File 2: `frontend/src/pages/LoginPage.tsx` (after line 460)
Add a LinkedIn login button below the Google button, same style.

---

## Verification
1. Click LinkedIn button on login page
2. Should redirect to LinkedIn consent screen
3. After consent → back to `/josoor-desktop` with active session
4. User appears in Supabase Auth → Users table
