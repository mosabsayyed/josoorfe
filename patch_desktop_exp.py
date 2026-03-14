import re

file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Fix desktop experience aspect ratio
text = re.sub(r"aspectRatio: ['\"]1685 / 913['\"]", "aspectRatio: isMobile ? 'auto' : '1685 / 913'", text)
text = re.sub(r"height: isMobile \? ['\"]auth['\"] : ['\"]auto['\"]", "height: 'auto'", text) # just in case

with open(file_path, 'w') as f:
    f.write(text)
