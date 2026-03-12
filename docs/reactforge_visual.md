# ReactForge — Complete Visual Improvement Document

**App:** React Forge — Visual Website Builder (localhost:3001)
**Stack:** React, Tailwind CSS (arbitrary values), Lucide React icons
**Goal:** Transform from "dark theme Tailwind starter" to premium, professional design tool

---

## SECTION 1 — COLOR PALETTE & DEPTH

### Current Problem
Your background chain (`#0f0f1a` → `#1a1a2e` → `#1e1e36` → `#2a2a4a`) is all in the same purple-navy family with no real contrast hierarchy. Every panel blurs into the next. There's no sense of elevation or layered depth.

### Fix: Proper Elevation System

Stop using hardcoded hex values scattered as arbitrary Tailwind classes. Define a semantic color system in your `tailwind.config.js` and as CSS variables:

```css
:root {
  /* Base surfaces — from darkest to lightest */
  --color-base:        #09090b;   /* outermost shell / canvas surround */
  --color-surface-1:   #111118;   /* primary panels (left sidebar, right panel) */
  --color-surface-2:   #16161f;   /* secondary surfaces, hover backgrounds */
  --color-surface-3:   #1e1e2e;   /* elevated cards, active states */

  /* Borders */
  --color-border-subtle:  rgba(255, 255, 255, 0.06);  /* panel separators */
  --color-border-default: rgba(255, 255, 255, 0.10);  /* component borders */
  --color-border-strong:  rgba(255, 255, 255, 0.18);  /* focused/active borders */

  /* Text */
  --color-text-primary:   rgba(255, 255, 255, 0.92);  /* headings, active labels */
  --color-text-secondary: rgba(255, 255, 255, 0.55);  /* body, inactive labels */
  --color-text-tertiary:  rgba(255, 255, 255, 0.32);  /* placeholders, disabled */

  /* Accent — reserve purple/blue only for interactive states */
  --color-accent:         #6366f1;  /* indigo — primary interactive */
  --color-accent-hover:   #818cf8;  /* lighter indigo on hover */
  --color-accent-subtle:  rgba(99, 102, 241, 0.12);  /* tinted backgrounds */
}
```

Then in `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      base:      'var(--color-base)',
      surface1:  'var(--color-surface-1)',
      surface2:  'var(--color-surface-2)',
      surface3:  'var(--color-surface-3)',
      border:    'var(--color-border-default)',
      'border-subtle': 'var(--color-border-subtle)',
      accent:    'var(--color-accent)',
    }
  }
}
```

Replace every `bg-[#1a1a2e]`, `bg-[#2a2a4a]`, etc. with semantic names. This means a single color change propagates everywhere instead of requiring a find-and-replace hunt.

### Additional Color Rules
- Reserve the purple-blue accent **only** for interactive elements (active states, focused inputs, selected items, progress indicators). Currently it bleeds into everything.
- Add a **subtle top-edge highlight** on elevated surfaces to simulate light: `border-top: 1px solid rgba(255,255,255,0.06)`. This creates perceived depth without drop shadows.
- The canvas surround (the dark area behind the white page) should be the deepest color (`#09090b`) to create maximum contrast with the white canvas frame.

---

## SECTION 2 — TYPOGRAPHY HIERARCHY

### Current Problem
Almost everything is `text-sm` (14px) at `text-gray-300/400`. Panel section headers, component labels, toolbar labels, and body text all share the same visual weight. There is no rhythm or hierarchy — the eye has nowhere to anchor.

### Fix: A Clear Type Scale

**Panel section headers / category labels** (e.g., "Sections", "All", "Layout", "Basic"):
```css
font-size: 11px;
font-weight: 600;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--color-text-tertiary);  /* muted, not competing with content */
```
This is one of the single most impactful changes you can make. Every professional tool (Figma, Linear, VS Code) uses this exact treatment for section headers. It creates a clear information tier without adding visual noise.

**Component button labels** (Grid, Container, Navbar, etc.):
```css
font-size: 11px;
font-weight: 500;
color: var(--color-text-secondary);
line-height: 1.2;
text-align: center;
```

**Toolbar labels** (Components, Layers, Pages, Assets — the panel tab labels):
```css
font-size: 11px;
font-weight: 500;
color: var(--color-text-secondary);  /* inactive */
/* active: */
color: var(--color-text-primary);
```

**Panel tab labels** (Style, Props, Advanced):
Same treatment — 11px, 500 weight, inactive at tertiary color, active at primary.

**Canvas empty state heading** ("Start Building"):
```css
font-size: 18px;
font-weight: 300;  /* light weight — large light text looks far more premium */
color: rgba(0,0,0,0.4);
letter-spacing: -0.01em;
```
Avoid `font-bold` or `font-semibold` on large display text in empty states — it reads like a system message. Light weight reads like intentional design.

**Canvas empty state subtext**:
```css
font-size: 13px;
font-weight: 400;
color: rgba(0,0,0,0.3);
line-height: 1.6;
```

### Font Family
Keep `Tajawal` for Arabic content labels. For the UI chrome (panel labels, toolbar text, code, keyboard shortcuts), switch to or add **Inter**, **Geist**, or **IBM Plex Sans** — these are purpose-built for UI density and render sharper at 11–13px than Tajawal. Load via Google Fonts or as a local variable font.

---

## SECTION 3 — THE TOP TOOLBAR

### Current Problems
- `h-14` (56px) is too tall for a dense professional tool — wastes vertical space
- Icon buttons feel scattered with no grouping clarity beyond hairline dividers
- The active viewport button (Desktop) is not clearly distinguished from inactive ones
- Undo/Redo buttons don't communicate their disabled state
- No shadow or separation from the canvas area below

### Fixes

**Height:** Drop toolbar to `h-10` or `h-11` (40–44px) with `px-3`. Tighter = more professional for tool UIs. Every pixel of vertical space matters when the canvas is below.

**Active viewport button** (Desktop/Tablet/Mobile): Use a white pill style for the active state:
```css
/* Active */
background: rgba(255, 255, 255, 0.12);
color: white;
border-radius: 6px;
/* Inactive */
background: transparent;
color: rgba(255, 255, 255, 0.4);
```
This is exactly how Figma handles its toolbar toggle groups — the selected state is immediately obvious without needing color.

**Undo/Redo disabled state:** When unavailable, drop to `opacity-25 cursor-not-allowed pointer-events-none`. Currently they look the same whether available or not, which breaks the user's feedback loop.

**Toolbar bottom separator:** Replace the hard `border-b` with a subtle shadow:
```css
box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04), 0 1px 8px rgba(0,0,0,0.3);
```
This creates a soft floating effect instead of a harsh ruled line.

**Icon button hover state:** All toolbar icon buttons should transition consistently:
```css
transition: background-color 120ms ease, color 120ms ease;
/* hover: */
background: rgba(255,255,255,0.08);
border-radius: 6px;
color: white;
```

**Active/pressed state on buttons:**
```css
/* active (mousedown): */
transform: scale(0.95);
transition: transform 75ms ease;
```
This micro-animation is invisible until you notice it's missing — then everything feels dead without it.

**Zoom indicator** (the "100%" text in the center): Give it a subtle clickable affordance — it should look like a button (rounded background on hover) since users expect to click it to reset zoom.

**Keyboard shortcut badges** in the empty state (`Ctrl+I`, `Ctrl+E`): Use proper `<kbd>` styling:
```css
background: rgba(0,0,0,0.08);
border: 1px solid rgba(0,0,0,0.15);
border-bottom-width: 2px;  /* gives the "keycap" look */
border-radius: 4px;
padding: 1px 5px;
font-size: 11px;
font-family: monospace;
```

---

## SECTION 4 — THE CANVAS AREA

### Current Problem
The white canvas on a near-white/transparent background with no texture makes the entire center of the app feel like a blank Word document. There's no sense of it being a design surface.

### Fix 1: Dot Grid Background
Replace the plain dark background behind the canvas with a dot grid — this is the single highest-impact change you can make. Every professional design tool (Figma, Framer, Penpot, Webflow) uses this pattern:

```css
.canvas-surround {
  background-color: #09090b;
  background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

For a finer, more subtle version:
```css
background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
background-size: 16px 16px;
```

### Fix 2: Canvas Frame Shadow
The white canvas "page" should feel physically lifted off the surface:
```css
.canvas-frame {
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),   /* edge highlight */
    0 4px 6px rgba(0,0,0,0.2),
    0 20px 60px rgba(0,0,0,0.5),        /* deep shadow for lift */
    0 40px 80px rgba(0,0,0,0.3);
  border-radius: 4px;  /* very slight rounding on canvas frame corners */
}
```

### Fix 3: Canvas Empty State
The current empty state uses a solid rounded box with a `+` icon (looks like a system placeholder) and a document icon that doesn't match the "start building" message.

Recommended treatment:
```html
<div class="empty-state">
  <!-- Dashed border drop zone instead of solid icon box -->
  <div style="
    width: 72px; height: 72px;
    border: 2px dashed rgba(0,0,0,0.15);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(0,0,0,0.2);
  ">
    <!-- Plus icon at 28px -->
  </div>
  <h2 style="font-size:18px; font-weight:300; color:rgba(0,0,0,0.4); margin-top:16px;">
    Start Building
  </h2>
  <p style="font-size:13px; color:rgba(0,0,0,0.3); margin-top:6px; line-height:1.6;">
    Drag components from the panel, or click any to add it.
  </p>
  <!-- kbd shortcuts below -->
</div>
```

### Fix 4: "Desktop View" Label
The label at the bottom of the canvas ("Desktop View") should be `11px uppercase tracking-widest` and `opacity-40` — it's informational only and shouldn't draw the eye. Currently it's styled like regular body text.

### Fix 5: Canvas Fade-In on Load
The canvas should fade in rather than appear instantly:
```css
@keyframes canvas-enter {
  from { opacity: 0; transform: scale(0.995); }
  to   { opacity: 1; transform: scale(1); }
}
.canvas-frame {
  animation: canvas-enter 200ms ease-out;
}
```

---

## SECTION 5 — THE LEFT STYLE PANEL

### Current Problem
The left panel is entirely empty when no component is selected — it just shows "Select a component to edit its styles" on a vast dark surface. The panel tabs (Style / Props / Advanced) use an underline style. The tab icons (sliders, gear, wrench) have inconsistent visual weights.

### Fix 1: Panel Tabs → Pill Toggle Style
Replace the underline tab style with a pill-style toggle group — this is the modern standard for dark UI tool panels:
```css
.tab-group {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 3px;
  display: flex;
  gap: 2px;
}
.tab {
  flex: 1;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  transition: all 120ms ease;
}
.tab.active {
  background: rgba(255,255,255,0.12);
  color: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
```

### Fix 2: Empty State — Don't Waste the Space
When nothing is selected, show useful content instead of a single hint line:

Options (pick one or combine):
- **Quick color tokens:** Show your defined color palette as small swatches — useful at a glance
- **Recent edits history:** Last 5 style changes made
- **Keyboard shortcut reference:** A minimal cheatsheet of the most useful shortcuts
- **Contextual tip:** A rotating single tip relevant to the current state

At minimum, center the empty state message properly and style it as:
```css
font-size: 12px;
color: rgba(255,255,255,0.25);
text-align: center;
padding: 24px 16px;
line-height: 1.6;
```
Currently the "Select a component to edit its styles" text is left-aligned and just dropped mid-panel. Center it vertically and horizontally in the empty panel.

### Fix 3: Panel Background Texture
Add a very subtle noise texture to the panel backgrounds. At 3–5% opacity, it makes dark flat panels look expensive instead of flat:
```css
.panel {
  position: relative;
}
.panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.04;
  border-radius: inherit;
}
```
This is a subtle trick used by Vercel, Linear, and Liveblocks in their dark UIs.

---

## SECTION 6 — THE RIGHT COMPONENT PANEL

### Current Problem
The component grid buttons are flat `bg-[#2a2a4a]` rectangles that all look identical. They have no hover depth, no grouping clarity, and the label/icon spacing is not optimally tuned.

### Fix 1: Component Button Hover Treatment
Replace flat hover with a gradient + border glow:
```css
.component-btn {
  background: rgb(42, 42, 74);            /* current flat color */
  border: 1px solid transparent;
  border-radius: 10px;
  transition: all 120ms ease;
}

.component-btn:hover {
  background: linear-gradient(
    160deg,
    rgba(60, 60, 100, 1) 0%,
    rgba(40, 40, 80, 1) 100%
  );
  border-color: rgba(99, 102, 241, 0.25);  /* subtle accent border glow */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),   /* inner top highlight */
    0 4px 12px rgba(0,0,0,0.3);
  transform: translateY(-1px);  /* subtle lift */
}

.component-btn:active {
  transform: scale(0.97) translateY(0);
  transition-duration: 60ms;
}
```

### Fix 2: Icon Size and Optical Balance
Current component icons are `18px`. For the button size you have (`p-3.5` = 14px padding), the icon should be `20px` — slightly larger icons in a button with generous padding look more intentional and easier to scan. Keep the label at 11px.

### Fix 3: Category Filter Pills
The "All / Layout / Basic / Forms / Media / Advanced" category tabs currently use a plain text-color toggle. Upgrade to pill badges:
```css
.category-filter {
  padding: 3px 10px;
  border-radius: 99px;  /* full pill */
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  background: transparent;
  transition: all 120ms ease;
}
.category-filter.active {
  background: rgba(99, 102, 241, 0.15);
  color: rgba(139, 143, 255, 1);
  border: 1px solid rgba(99, 102, 241, 0.3);
}
```

### Fix 4: "Sections" Label Hierarchy
The "Sections" label above the component grid should use the uppercase tracking treatment from Section 2:
```css
font-size: 10px;
font-weight: 600;
letter-spacing: 0.1em;
text-transform: uppercase;
color: rgba(255,255,255,0.28);
margin-bottom: 8px;
padding: 0 4px;
```

### Fix 5: Search Box
The search input needs work:
```css
.search-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 7px 10px 7px 32px;  /* left padding for search icon */
  font-size: 12px;
  color: white;
  transition: border-color 120ms ease, background 120ms ease;
}
.search-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255,255,255,0.07);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.search-input::placeholder {
  color: rgba(255,255,255,0.25);
}
```

---

## SECTION 7 — ICONS (FULL AUDIT)

### Icon Library
You're using **Lucide React** throughout — a solid choice (stroke-width: 2, viewBox: 0 0 24 24, fill: none). However there is one **Phosphor icon** mixed in (the AI Assistant button — viewBox: 0 0 256 256, fill-based), which breaks consistency since it renders as a filled icon while everything else is outlined.

### Size Inconsistency
You have icons at **four different sizes** with no system:

| Size | Location | Count | Problem |
|---|---|---|---|
| 16×16 | Toolbar | 18 | Correct for toolbar |
| 18×18 | Component panel + panel tabs | 35 | Correct for panels |
| 20×20 | Project icon in header (one-off) | 1 | Rogue — should be 16px |
| 32×32 | Canvas empty state | 1 | Inconsistent stroke weight |

**Rule:** Lock to a strict two-size system — `16px` for toolbar/utility icons, `18px` for panel component icons. Zero exceptions.

**Also:** The canvas empty state icon uses `stroke-width="1.5"` while everything else uses `stroke-width="2"`. At small sizes this is noticeable — that one icon looks visually lighter/thinner than the rest. Fix to `stroke-width="2"`.

### Semantic Mismatches — Wrong Icon for the Job

**`Button` component icon → Uses `mouse-pointer` (cursor)**
A cursor represents clicking/selecting (a tool mode), not a button element. This is genuinely confusing — it looks like a "select" tool state, not a draggable component.
Fix: Use Lucide `square` with a horizontal aspect, or `rectangle-horizontal`, or draw a simple custom rounded-rect icon.

**`Container` component icon → Uses 3D `package` (shipping box)**
A container in web layout is a flat 2D wrapper. A 3D box communicates physical storage, not layout.
Fix: Use Lucide `square-dashed` or `layout` — a flat outlined rectangle reads immediately as "a box on the page."

**`Carousel` component icon → Uses the `layers` icon**
This is the same icon used for the **Layers** panel tab in your top-right navigation. Having the same icon mean two completely different things in the same interface — one is a panel tab, one is a component — is a significant UX failure.
Fix: Use Lucide `gallery-horizontal` or `images` (the multi-image icon).

**`Accordion` component icon → Uses a single `chevron-down`**
A lone chevron is used everywhere as a generic "expand/collapse" indicator (dropdowns, selects, collapsibles). It gives no sense that this is a multi-section collapsible component.
Fix: Use Lucide `list-collapse`, `panel-top-open`, or `chevrons-down-up`.

**`Tabs` component icon → Uses `folder`**
A folder represents files and directories — entirely unrelated to a tabbed interface.
Fix: Use Lucide `layout-panel-top`, `panel-top`, or `columns`.

**`Code` and `Custom HTML` → Both use identical `<>` brackets icon**
They are completely indistinguishable from each other in the grid. A user scanning the panel cannot tell them apart.
Fix: Keep `<>` (Lucide `code`) for the Code block component. Use Lucide `file-code`, `braces`, or `code-xml` for Custom HTML.

**`Hero Section` → Uses a 2×2 grid icon**
A generic grid icon looks the same as what you'd expect for a Grid or Layout component.
Fix: Use Lucide `layout-template` which shows a header section + body — semantically accurate for "hero."

**`Navbar` → Uses a hamburger menu icon (3 horizontal lines)**
This is acceptable but generic — a hamburger represents *opening* a mobile nav, not a "Navbar" component as a whole.
Fix: Acceptable as-is, but Lucide `panel-top` or a custom 3-line top-bar icon reads more accurately as a navbar structure.

### Additional Icon Issues

**Back to Projects arrow → Points right (→)**
The action navigates backward, so the arrow should point left (←). In LTR interfaces, "back" is universally left-facing. Use Lucide `arrow-left` instead of `arrow-right`.
**The Phosphor AI Assistant icon**
Replace with Lucide `sparkles` or `bot`. This removes the one non-Lucide icon and brings the library to 100% consistent. The Phosphor icon currently renders bolder and filled compared to all other outlined icons — it visually stands out as a foreign element.

**Inactive icon color inconsistency**
Some icons sit at `text-gray-400` and others at `text-gray-300` with no clear rule. Establish a strict three-state icon color system:
```
Inactive/default: rgba(255,255,255,0.40)  → text-white/40
Hover:            rgba(255,255,255,0.75)  → text-white/75
Active/selected:  rgba(255,255,255,1.00)  → text-white
  OR active with accent color: rgb(139,143,255)
```

**Panel tab icons** (the sliders/gear/wrench for Style/Props/Advanced)
These currently look visually heavier than the component icons because they're rendered at the same 16px size but with more complex path data. Consider reducing their visual complexity or replacing with simpler single-path icons:
- Style (currently: sliders) → Keep, it's semantically clear
- Props (currently: gear/cog) → Keep
- Advanced (currently: wrench) → Consider `zap` or `settings-2` for a cleaner look

---

## SECTION 8 — SHADCN/UI INTEGRATION

### You Already Have Tailwind
Every class in your app is already Tailwind. Adding Tailwind is not an option — it's already your foundation. The visual issues come from design decisions made *with* Tailwind, not from Tailwind itself.

### Where shadcn/ui Genuinely Helps

Use it **surgically** for interactive form controls in the style panel — not globally.

| Component | Use Case | Worth It? |
|---|---|---|
| `Tooltip` | Toolbar icon hover hints | ✅ Yes — one line, instant polish |
| `Tabs` | Style / Props / Advanced panel | ✅ Yes — handles active state, keyboard nav |
| `Select` | Anywhere you have `<select>` dropdowns | ✅ Yes — raw selects look system-default |
| `Slider` | Opacity, font-size, border-radius controls | ✅ Yes — custom sliders are painful to style |
| `Dialog` | Export modal, settings, rename project | ✅ Yes — Radix handles focus trap, a11y |
| `Input` | Style panel number fields | ✅ Yes — consistent focus rings |
| `Switch` | Boolean property toggles | ✅ Yes |
| `Badge` | Category filter pills (All, Layout, Basic…) | ✅ Useful |
| `Navbar/Sidebar` | Your main panels | ❌ Skip — needs custom behavior |
| `Card` | Component grid buttons | ❌ Skip — yours is fine |
| `Button` | Toolbar buttons | ❌ Skip — already consistent |

### The Critical Step Before shadcn: Design Tokens
shadcn inherits your CSS variables. If your color tokens are flat and low-contrast, shadcn components will be too. Set up the CSS variable system from Section 1 **before** adding shadcn, or its components will look off-brand.

---

## SECTION 9 — MICRO-INTERACTIONS & TRANSITIONS

### Current Problem
`transition-colors` is used on some elements, but there are very few transitions on scale, shadow, position, or opacity. Professional tools have snappy, purposeful micro-animations that make the interface feel alive and responsive.

### Rules for Transitions
- **Color transitions:** 120ms ease (current, keep this)
- **Scale/transform on click:** 75ms ease (faster = snappier)
- **Hover lift effects:** 120ms ease
- **Panel open/close (height):** 200ms ease-out
- **Canvas fade-in on load:** 200ms ease-out
- **Never use `transition: all`** — it catches unexpected properties and causes layout jank

### Specific Additions

**All interactive buttons:**
```css
transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
```

**Component panel buttons:**
```css
transition: background 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
```
```css
/* on active press: */
&:active { transform: scale(0.97); transition-duration: 60ms; }
```

**Panel section expand/collapse** (if you add collapsible sections):
```css
max-height transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
opacity transition: 150ms ease;
```

**Search input focus:**
```css
transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
```

**Icon color changes:**
```css
transition: color 100ms ease;
```

---

## SECTION 10 — PRIORITY IMPLEMENTATION ORDER

Not everything needs to be done at once. Here is the strict priority order based on visual impact per effort:

### Tier 1 — Highest Impact, Low Effort (Do First)
1. **Dot grid canvas background** — One CSS change, single biggest "this is a real tool" signal
2. **Active viewport button as white pill** — Immediately reads professional, trivial CSS
3. **Section header typography** — `uppercase tracking-widest text-[11px]` on all panel section labels
4. **Canvas frame shadow** — Makes the page feel physically lifted, one `box-shadow` property
5. **Flip "Back to Projects" arrow** — Lucide `arrow-left` instead of `arrow-right`, one component swap

### Tier 2 — High Impact, Medium Effort (Do Second)
6. **Fix semantic icon mismatches** — Replace `Carousel` (same as Layers), `Code`+`Custom HTML` (identical), `Button` (cursor), `Container` (3D box), `Tabs` (folder)
7. **Replace Phosphor AI icon** — Lucide `sparkles` or `bot` to unify the library
8. **Component button hover gradient + border glow** — CSS only, no structural changes
9. **Category filter pills** — Replace flat text toggles
10. **Lock icon sizes to 16/18px system** — Fix the 20px and 32px outliers, normalize stroke-width

### Tier 3 — High Polish, More Effort (Do Third)
11. **CSS custom property system** — Replace all hardcoded hex values with semantic tokens
12. **Panel tab pill toggle style** — Replace underline tabs
13. **Canvas empty state redesign** — Dashed border, light weight heading, proper kbd styling
14. **Panel background noise texture** — Subtle but makes panels look premium
15. **Toolbar height reduction** to `h-10`/`h-11`

### Tier 4 — Refinements (Do Last)
16. **Add shadcn/ui** — Tooltip, Tabs, Select, Slider, Dialog, Switch
17. **Populate left panel empty state** — Quick tokens, shortcuts reference, or recent history
18. **Canvas fade-in animation**
19. **Undo/Redo disabled opacity**
20. **Full micro-interaction audit** — Scale on press, hover lifts throughout

---

## QUICK REFERENCE CHEAT SHEET

```
COLORS (replace all hardcoded hex)
  Deepest bg:        #09090b
  Panel bg:          #111118
  Elevated surface:  #1e1e2e
  Border:            rgba(255,255,255,0.08)
  Accent:            #6366f1

TEXT COLORS
  Primary:    rgba(255,255,255,0.92)
  Secondary:  rgba(255,255,255,0.55)
  Tertiary:   rgba(255,255,255,0.32)

ICON STATES
  Default:    rgba(255,255,255,0.40)
  Hover:      rgba(255,255,255,0.75)
  Active:     rgba(255,255,255,1.00)

ICON SIZES (strict)
  Toolbar:    16×16px, stroke-width: 2
  Panels:     18×18px, stroke-width: 2
  (No other sizes)

TYPE SCALE
  Section headers:  11px, 600w, uppercase, 0.08em tracking
  Component labels: 11px, 500w
  Toolbar labels:   11px, 500w
  Body/hints:       12–13px, 400w

TRANSITIONS
  Color:        120ms ease
  Press scale:  75ms ease → scale(0.97)
  Panel expand: 200ms ease-out

ICONS TO REPLACE
  Back arrow:    arrow-right → arrow-left
  Button:        mouse-pointer → rectangle-horizontal
  Container:     package → square-dashed
  Carousel:      layers → gallery-horizontal
  Accordion:     chevron-down → list-collapse
  Tabs:          folder → layout-panel-top
  Custom HTML:   code → file-code (distinguish from Code block)
  AI Assistant:  Phosphor icon → Lucide sparkles
```