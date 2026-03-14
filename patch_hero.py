import re

with open('/home/mosab/projects/josoorfe/frontend/src/components/landing/Hero.css', 'r') as f:
    text = f.read()

# Fix aspect-ratio on mobile
text = text.replace("  aspect-ratio: 1685 / 913;\n", "")
text = text.replace("  height: calc(100dvh - 130px);\n  }", "  height: calc(100dvh - 130px);\n    aspect-ratio: 1685 / 913;\n  }")

# Add max-width constraint to title container
text = text.replace(".hero-title-container {\n  position: absolute;\n  top: 16px;\n  z-index: 20;\n  pointer-events: none;\n}", ".hero-title-container {\n  position: absolute;\n  top: 16px;\n  z-index: 20;\n  pointer-events: none;\n  max-width: calc(100vw - 2rem);\n}")

# Fix paddingTop to 72px on mobile (if we want to match plan exactement, although I had it at 60px before)
text = text.replace("padding-top: 60px;", "padding-top: 72px;")

with open('/home/mosab/projects/josoorfe/frontend/src/components/landing/Hero.css', 'w') as f:
    f.write(text)
