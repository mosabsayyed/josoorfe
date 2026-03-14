import re

file_path = 'frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Change it to 100% height, width auto, positioned in the center, and not cropped.
text = text.replace(
    "style={{ width: '100%', height: '100%', objectFit: 'fill', position: 'absolute', inset: 0 }}",
    "style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top', position: 'absolute', inset: 0 }}"
)

# Wait, if we want "fix height and let width run free", it should be objectFit: 'cover', objectPosition: 'left top'? or 'center top'? If height fits, and width overflows.
# Or if it's an <img>, we can say width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center'
# Or wait, if we changed the container's aspect ratio, the container height is 50vh.
# If we do object-fit: contain, it letterboxes inside.
# If we want the height to be 100% and width to overflow:
text = text.replace(
    "style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top', position: 'absolute', inset: 0 }}",
    "style={{ height: '100%', width: 'auto', minWidth: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}"
)

with open(file_path, 'w') as f:
    f.write(text)

