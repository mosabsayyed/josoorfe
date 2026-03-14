import re

file_path = './src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Make images contain instead of cover
content = re.sub(r"objectFit:\s*'cover'", "objectFit: 'contain'", content)

# Look for dots and scale them down
# Will print out matches first to see them
import sys
for match in re.finditer(r"width:\s*'(\d+px)'", content):
    if match.group(1) in ['12px', '16px', '24px']:
        pass # print(f"Found dot/icon size: {match.group(1)}")
