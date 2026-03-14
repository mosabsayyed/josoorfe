import re

file_path = 'frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Change cover to contain or just 100% since calc zoomed it
text = text.replace(
    "style={{ width: 'calc(100% + 2px)', height: 'calc(100% + 2px)', margin: '-1px', objectFit: 'cover', position: 'absolute', inset: 0 }}",
    "style={{ width: '100%', height: '100%', objectFit: '100% 100%', position: 'absolute', inset: 0 }}"
)

# Actually object-fit: 100% 100% doesn't exist, it's fill or contain.
# Wait, object-fit: fill makes it stretch exactly to box without cropping (unlike cover)
# Or object-fit: 'contain', background-color: #000? Let's use 'fill' if you want it to conform perfectly without cropping the taskbar!
text = text.replace(
    "objectFit: '100% 100%'",
    "objectFit: 'fill'"
)

with open(file_path, 'w') as f:
    f.write(text)

