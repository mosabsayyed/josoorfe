import re

# 1. Update Hero.css
css_file = 'frontend/src/components/landing/Hero.css'
with open(css_file, 'r') as f:
    css = f.read()

# Add border to .hero-desktop-container
css = re.sub(
    r'(\.hero-desktop-container\s*\{\s*position:\s*relative;\s*width:\s*100%;\s*height:\s*50vh;\s*min-height:\s*380px;\s*max-width:\s*100%;\s*margin:\s*0\s+auto;\s*border-radius:\s*12px;)',
    r'\1\n  border: 1px solid rgba(255, 255, 255, 0.15);',
    css
)
with open(css_file, 'w') as f:
    f.write(css)

# 2. Update DesktopExperience.tsx
desk_file = 'frontend/src/components/landing/DesktopExperience.tsx'
with open(desk_file, 'r') as f:
    desk = f.read()

desk = desk.replace(
    "paddingTop: isMobile ? '12%' : '8%',",
    "paddingTop: isLandscapeMobile ? '20%' : (isMobile ? '28%' : '15%'),"
)

with open(desk_file, 'w') as f:
    f.write(desk)

