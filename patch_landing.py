import re

with open('/home/mosab/projects/josoorfe/frontend/src/pages/LandingPage.tsx', 'r') as f:
    text = f.read()

# Fix .section-content-box display
text = text.replace("display: inline-block;\n        width: 100%;", "display: block;\n        width: 100%;")

# Add a 480px media query
new_mq = """
      @media (max-width: 480px) {
        section.content-centered {
          padding: 32px 0.75rem;
        }
        #arch, #beta {
          padding-top: 32px;
        }
      }
"""

if "@media (max-width: 480px)" not in text:
    # insert before the 768px media query or at the end of the style block
    text = text.replace("      @media (max-width: 768px) {", new_mq + "\n      @media (max-width: 768px) {")

with open('/home/mosab/projects/josoorfe/frontend/src/pages/LandingPage.tsx', 'w') as f:
    f.write(text)
