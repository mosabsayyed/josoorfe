import re
file_path = 'frontend/src/components/layout/Header.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Change isMobile breakpoint to catch mobile landscape as well
text = text.replace('window.innerWidth <= 768', 'window.innerWidth <= 1024')

with open(file_path, 'w') as f:
    f.write(text)
print("Header breakpoint updated")
