import re

file_path = 'frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Let's use left top if we want the actual taskbar to show accurately depending on orientation
text = text.replace(
    "style={{ height: '100%', width: 'auto', minWidth: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}",
    "style={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'left bottom', position: 'absolute', inset: 0 }}"
)

with open(file_path, 'w') as f:
    f.write(text)

