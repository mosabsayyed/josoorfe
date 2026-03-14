import re
file_path = 'frontend/src/components/layout/Header.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Let's ensure the isMobile state actually captures landscape mobile
# I'll also add window.innerHeight check to definitely catch landscape
text = re.sub(
    r"const check = \(\) => setIsMobile\(window\.innerWidth <= \d+\);",
    "const check = () => setIsMobile(window.innerWidth <= 1024 || window.innerHeight <= 450);",
    text
)

with open(file_path, 'w') as f:
    f.write(text)
print("Header landscape fix applied")
