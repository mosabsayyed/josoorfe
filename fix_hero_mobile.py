import re
file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/Hero.css'
with open(file_path, 'r') as f:
    text = f.read()

# Add a reliable min-height to mobile hero-desktop-container
old_css = """.hero-desktop-container {
  position: relative;
  height: calc(100dvh - 120px);
  max-width: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
}"""

new_css = """.hero-desktop-container {
  position: relative;
  height: calc(100dvh - 120px);
  min-height: 400px;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  /* Ensure it has a minimum height so it never collapses to 0 */
  display: flex;
  flex: 1;
}"""

text = text.replace(old_css, new_css)

with open(file_path, 'w') as f:
    f.write(text)
print("Done")
