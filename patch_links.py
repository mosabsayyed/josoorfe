import re

file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/SolutionBlocks.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Remove EvidenceLinks component usage
text = re.sub(
    r"\{def\.evidence && def\.evidence\.length > 0 && \(\s*<EvidenceLinks[^>]+/>\s*\)\}",
    "",
    text
)

with open(file_path, 'w') as f:
    f.write(text)
