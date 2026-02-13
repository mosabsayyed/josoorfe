# Landing Page v10 Migration Plan

## Overview
Migrate the HTML landing page (josoor-pitch-v10.html) to React while preserving ALL design, animations, and interactions.

## Critical Differences Found

### What I Did Wrong
1. Used simple grid layouts instead of complex 3D carousels
2. Used simple SVG lines instead of curved paths
3. Ignored all animations and interactions
4. Used wrong fonts (Inter vs IBM Plex)
5. Used wrong color scheme
6. Created simple static sections instead of interactive components

### What Needs to Be Done Right

## Component Architecture

### 1. Design System Migration
**From v10 HTML:**
- Fonts: IBM Plex Sans, IBM Plex Mono, IBM Plex Sans Arabic
- Colors: Gold (#F4BB30), Teal (#145c80), specific token system
- Spacing: Custom --space-* variables
- Animations: pulseGlow, scanPulse, bounce, pulse

**To React:**
- Keep existing React CSS variables BUT add v10's tokens
- Import IBM Plex fonts via Google Fonts
- Add animation @keyframes to CSS

### 2. Hero Section
**HTML Structure:**
- Video background with overlay
- Centered content
- h1 with `.hw` class (gold gradient)
- Special brand box with border and shadow
- Signal preview badges (red/amber/green dots)

**React Implementation:**
- Keep video element structure
- Add gold gradient text styling
- Create brand box component
- Add signal badges with colored dots

### 3. No Noise Section
**HTML Structure:**
- SVG with 7 CURVED PATHS (not straight lines)
- Each path uses complex `d=` attribute with bezier curves
- Labels: "scattered inputs" (left), "one signal" (right)
- Convergence point with pulsing gold dot
- Output line with drop-shadow filter

**React Implementation:**
- Use exact SVG paths from HTML
- Add pulseGlow keyframe animation
- Use CSS filters for shadows
- Keep color coding (l1-l7 classes)

### 4. Claims Section
**HTML Structure:**
- VERTICAL LIST (not grid!)
- Each item: numbered circle + text
- Hover effects: border color change, gradient background
- Numbers in circles with gold border

**React Implementation:**
- Map over claims array
- Create .claim-item with flex layout
- Add hover transition styles
- Circle numbers with gold styling

### 5. Promise (Personas) Section
**HTML Structure:**
- 3D CONCAVE CAROUSEL
- 4 persona cards with photos
- Cards positioned with data-pos attribute (-2, -1, 0, 1, 2, hidden)
- 3D transforms: translateX, rotateY, scale
- Navigation: prev/next buttons + dots
- Auto-rotate every 4.5 seconds
- Pause on hover

**React Implementation:**
- Create ConcaveCarousel component
- State: currentIndex
- CSS transforms based on position relative to current
- useEffect for auto-rotation with cleanup
- Event handlers for navigation
- Photo + content layout for each card

### 6. Platform (Modes) Section
**HTML Structure:**
- Same 3D CONCAVE CAROUSEL
- 3 mode cards (Watch, Decide, Deliver)
- Each card split: left text + right MINIATURE MOCKUP
- Mockups show actual interface previews (dashboard chrome, metrics, signals)
- Auto-rotate every 6 seconds

**React Implementation:**
- Reuse ConcaveCarousel component with different config
- Create MockupChrome component (red/yellow/green dots + label)
- Create WatchMockup, DecideMockup, DeliverMockup components
- Each mockup has detailed mini-interface

### 7. Architecture Section
**HTML Structure:**
- FLIPPABLE 3D PYRAMID
- Front: 4 layers pyramid (L1-L4) with widths 30%, 50%, 75%, 100%
- Back: Ontology mapping rows with badges
- Signal detectors overlay with scanning animation
- Click to flip (rotateY 180deg)
- Engine cards (BUILD, OPERATE)
- KSA compatibility badges

**React Implementation:**
- Create PyramidFlip component with state (isFlipped)
- CSS: perspective, transform-style: preserve-3d, backface-visibility
- Front face: pyramid layers
- Back face: ontology rows
- Signal overlay with scanPulse animation
- Toggle flip on click

### 8. Beta Form
**HTML Structure:**
- 2-column grid layout
- Gold border button with transparent background
- Hover: gold faint background + glow shadow
- Select dropdown with custom styling
- Textarea for optional question

**React Implementation:**
- Form state with name, email, org, role, challenge
- Grid layout for name/email and org/role rows
- Supabase submission (reuse existing logic)
- Success message in button

## Migration Steps

1. **Setup**
   - Add IBM Plex fonts to index.html
   - Add v10 CSS variables to LandingPage.tsx
   - Add animation keyframes

2. **Create Reusable Components**
   - ConcaveCarousel.tsx (for personas & modes)
   - PyramidFlip.tsx (for architecture)
   - MockupChrome.tsx (for mode mockups)

3. **Migrate Sections in Order**
   - Hero (simplest)
   - No Noise (SVG paths)
   - Claims (vertical list)
   - Promise (carousel + personas)
   - Platform (carousel + mockups)
   - Architecture (pyramid flip)
   - Beta (form)

4. **Testing**
   - Visual comparison side-by-side
   - Test all animations
   - Test carousel navigation
   - Test pyramid flip
   - Test responsive breakpoints
   - Test auto-rotation
   - Test pause-on-hover

## Key Technical Challenges

1. **3D Carousel**: Complex positioning logic with wrap-around
2. **SVG Curved Paths**: Need exact path d= attributes
3. **Miniature Mockups**: Detailed nested components
4. **Pyramid Flip**: 3D transform with preserve-3d
5. **Auto-rotation**: useEffect with interval cleanup

## Testing Strategy

1. Read v10 HTML in browser as reference
2. Build React version section by section
3. Use browser DevTools to compare styles
4. Test interactions manually
5. Ask user for visual review

## Completion Criteria

- [ ] All v10 content present
- [ ] All animations working
- [ ] Carousel auto-rotates and responds to clicks
- [ ] Pyramid flips on click
- [ ] SVG animation matches v10
- [ ] Hover effects work
- [ ] Form submits to Supabase
- [ ] Responsive on mobile
- [ ] No console errors
