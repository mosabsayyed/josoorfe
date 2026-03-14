css_file = 'frontend/src/components/landing/Hero.css'
with open(css_file, 'r') as f:
    css = f.read()

# I need to ensure there is exactly one border: 1px solid rgba(255, 255, 255, 0.15);
# under .hero-desktop-container.

import re
css = re.sub(r'border: 1px solid rgba\(255, 255, 255, 0\.15\);\n', '', css)

# Re-insert cleanly
css = re.sub(
    r'(border-radius:\s*12px;)',
    r'\1\n  border: 1px solid rgba(255, 255, 255, 0.15);',
    css,
    count=1
)

with open(css_file, 'w') as f:
    f.write(css)
