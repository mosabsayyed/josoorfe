import re

with open('frontend/public/att/cube/founder.html', 'r') as f:
    text = f.read()

# remove :root variable overrides inside media queries
text = re.sub(r':root\s*\{[\s\S]*?--intro1-h1-line-height:\s*36px;\s*\}', '', text)

# remove font-size !important overrides
text = re.sub(r'font-size:\s*\d+px\s*!important;', '', text)
text = re.sub(r'line-height:\s*\d+px\s*!important;', '', text)

# We won't remove empty selectors to avoid regex ReDoS.

with open('frontend/public/att/cube/founder.html', 'w') as f:
    f.write(text)
