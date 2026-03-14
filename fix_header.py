import re
file_path = 'frontend/src/components/layout/Header.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Replace multiple isLandscape hooks with just one
text = re.sub(r'(  const \[isLandscape, setIsLandscape\] = useState\(false\);\n)+', '  const [isLandscape, setIsLandscape] = useState(false);\n', text)

with open(file_path, 'w') as f:
    f.write(text)
