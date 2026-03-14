import re
file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/Hero.css'
with open(file_path, 'r') as f:
    text = f.read()

# Replace my previous bad flex fix with a solid block + aspect ratio fix
new_css = """.hero-desktop-container {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 400px;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  display: block;
}"""

# Use regex to replace the entire .hero-desktop-container block (up to the media query)
pattern = r"\.hero-desktop-container\s*\{[^}]+\}"
text = re.sub(pattern, new_css, text, count=1)

with open(file_path, 'w') as f:
    f.write(text)
print("Done")
