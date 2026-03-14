css_file = 'frontend/src/components/landing/Hero.css'
with open(css_file, 'r') as f:
    lines = f.readlines()

out = []
for line in lines:
    if line.strip() == "border: 1px solid rgba(255, 255, 255, 0.15);":
        # we will handle dedup by only allowing 1
        pass
    else:
        out.append(line)

with open(css_file, 'w') as f:
    f.writelines(out)
