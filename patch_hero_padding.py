import re

file_path = '/home/mosab/projects/josoorfe/frontend/src/pages/LandingPage.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Replace padding-bottom: 60px; with padding-bottom: 0px; for .hero-section
text = text.replace("padding-bottom: 60px;", "padding-bottom: 0px;")

with open(file_path, 'w') as f:
    f.write(text)
