import re

file_path = '/home/mosab/projects/josoorfe/frontend/src/pages/LandingPage.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Replace flex-direction: row; with flex-direction: column; for .hero-section
text = text.replace("flex-direction: row;", "flex-direction: column;")

with open(file_path, 'w') as f:
    f.write(text)
