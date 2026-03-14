import re

with open('frontend/public/att/cube/founder.html', 'r') as f:
    text = f.read()

# Replace root variables
old_vars = """    /* Font size variables - edit these to change all heading and paragraph sizes */
    :root {
      --h1-font-size: 72px;
      --h1-line-height: 84px;
      --h2-font-size: 38px;
      --h2-line-height: 46px;
      --p-font-size: 24px;
      --p-line-height: 40px;
      --intro1-h1-font-size: 58px;
      --intro1-h1-line-height: 66px;
    }"""

new_vars = """    /* Font size variables - mobile-first fluid typography using clamp() */
    :root {
      --h1-font-size: clamp(36px, 5vw, 72px);
      --h1-line-height: clamp(42px, 6vw, 84px);
      --h2-font-size: clamp(24px, 4vw, 38px);
      --h2-line-height: clamp(32px, 5vw, 46px);
      --p-font-size: clamp(16px, 2vw, 24px);
      --p-line-height: clamp(24px, 3.5vw, 40px);
      --intro1-h1-font-size: clamp(32px, 4.5vw, 58px);
      --intro1-h1-line-height: clamp(40px, 5.5vw, 66px);
    }"""

text = text.replace(old_vars, new_vars)

# Remove the media queries that manually scale down the font variables

text = re.sub(r'@media \(max-width:\s*900px\) \{[\s\S]*?\} \(max-width', '} \n@media (max-width', text)

with open('frontend/public/att/cube/founder.html', 'w') as f:
    f.write(text)
