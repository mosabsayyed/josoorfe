import re
file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Fix broken image references
text = text.replace('ontology2.png', 'ontology.jpg')
text = text.replace('observe3.jpg', 'observe.jpg')
text = text.replace('observe4.jpg', 'observe1.png')
text = text.replace('chatexpert3.jpg', 'chatexpert.jpg')
text = text.replace('chatexpert4.jpg', 'chatexpert1.jpg')
text = text.replace('deliver5.png', 'deliver.jpg')
text = text.replace('deliver6.png', 'deliver1.jpg')
text = text.replace('decide5.jpg', 'decide.jpg')

with open(file_path, 'w') as f:
    f.write(text)
print("Done fixing images")
