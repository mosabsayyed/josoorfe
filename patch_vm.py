import re

file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/VisionMemory.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Replace translation keys
text = text.replace("t('landing.visionMemory.stat')", "t('visionMemory.statValue')")
text = text.replace("t('landing.visionMemory.statLabel')", "t('visionMemory.statLabel')")
text = text.replace("t('landing.visionMemory.title')", "t('visionMemory.title')")
text = text.replace("t('landing.visionMemory.desc')", "t('visionMemory.description')")
text = text.replace("t('landing.visionMemory.highlight')", "t('visionMemory.subtitle')")

with open(file_path, 'w') as f:
    f.write(text)
