import re

css_file = 'frontend/src/components/landing/Hero.css'
with open(css_file, 'r') as f:
    css = f.read()

# Add border to .hero-desktop-container
css = re.sub(
    r'(border-radius:\s*12px;)',
    r'\1\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);',
    css,
    count=1
)
with open(css_file, 'w') as f:
    f.write(css)

