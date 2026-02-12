---
name: UI Verification Protocol
description: Mandatory checklist for verifying UI interactivity and correctness.
---

# UI Verification Protocol

## 0. Rule Zero: Never Assume
"Visible" does not mean "Functional".
"Compiled" does not mean "Working".

## 1. Visual Verification
- [ ] **Existence**: Are the elements present?
- [ ] **Appearance**: do they look correct (color, icon, size)?
- [ ] **Layout**: Alignment, spacing, responsiveness (resize window).

## 2. Interactive Verification (Mandatory)
- [ ] **Hover State**:
    - Does the cursor change (pointer vs default)?
    - Do tooltips appear?
    - Do hover effects (glow, scale) trigger?
- [ ] **Click Actions**:
    - **MUST CLICK**: You must explicitly instruct the browser subagent to CLICK the element.
    - **Observe Consequence**: Did a panel open? Did the URL change? Did the map zoom?
    - **Check Console**: Are there errors upon clicking?
- [ ] **Data Output**:
    - Does the clicked element show the *correct* data (e.g., clicking "Yas Island" shows "Yas Island" details, not generic text)?

## 3. Subagent Instructions Template
When using `browser_subagent`, your prompt MUST include:
```text
1. Interact: Hover over [Element X] and report if tooltip appears.
2. Interact: Click [Element X].
3. Verify: Check if [Expected Result, e.g., Detail Panel] is visible.
4. Debug: Check console logs for errors after interaction.
```

## 4. Failure Protocol
If any step fails:
1. **STOP**. Do not mark as execution complete.
2. **Report**: Tell the user exactly what failed (e.g., "Markers are visible but not clickable").
3. **Debug**: Check event handlers (`onClick`, `pointer-events`).
