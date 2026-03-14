import re

file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/ConcaveCarousel.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove specific inline height overrides. E.g. style={{ height: isMobile ? 'auto' : height }}
content = re.sub(
    r"style=\{\{\s*height: isMobile \? ['\"]auto['\"] : height\s*\}\}",
    "",
    content
)

# And platform inline max-width maybe? Let's check what's there
with open(file_path, 'w') as f:
    f.write(content)
