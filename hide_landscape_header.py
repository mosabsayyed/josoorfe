import re
file_path = 'frontend/src/components/layout/Header.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Add isLandscape state
state_block = r"const \[isMobile, setIsMobile\] = useState\(false\);"
new_state_block = """const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);"""
text = re.sub(state_block, new_state_block, text)

# Update check function
check_block = r"""const check = \(\) => setIsMobile\(window\.innerWidth <= 1024 \|\| window\.innerHeight <= 450\);"""
new_check_block = """const check = () => {
      setIsMobile(window.innerWidth <= 1024 || window.innerHeight <= 450);
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerHeight <= 500);
    };"""
text = re.sub(check_block, new_check_block, text)

# Update header style to display: none if landscape
header_block = r"<header style=\{\{"
new_header_block = "<header style={{\n      display: isLandscape ? 'none' : 'flex',"
# We also need to remove the existing display: 'flex' if it's there
text = re.sub(header_block, new_header_block, text)
text = re.sub(r"display:\s*'flex',\n\s*alignItems:\s*'center',", "alignItems: 'center',", text)

with open(file_path, 'w') as f:
    f.write(text)
print("Header landscape hide applied")
