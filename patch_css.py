import re

with open('/home/mosab/projects/josoorfe/frontend/src/styles/landing.css', 'r') as f:
    text = f.read()

# Add a rule for max-width 768px to hide the side cards
new_rule = """
@media (max-width: 768px) {
  .cc-card[data-pos="-1"],
  .cc-card[data-pos="1"],
  .cc-card[data-pos="-2"],
  .cc-card[data-pos="2"] {
    opacity: 0 !important;
    pointer-events: none !important;
  }
}
"""

text += new_rule

with open('/home/mosab/projects/josoorfe/frontend/src/styles/landing.css', 'w') as f:
    f.write(text)
