import re
desk_file = 'frontend/src/components/landing/DesktopExperience.tsx'
with open(desk_file, 'r') as f:
    desk = f.read()

desk = desk.replace(
    "paddingTop: isLandscapeMobile ? '20%' : (isMobile ? '28%' : '15%'),",
    "paddingTop: isLandscapeMobile ? '25%' : (isMobile ? '35%' : '22%'),"
)

with open(desk_file, 'w') as f:
    f.write(desk)
