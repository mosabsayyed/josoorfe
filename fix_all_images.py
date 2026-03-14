import re
file_path = '/home/mosab/projects/josoorfe/frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# Make sure we use exactly what's inside the public folder. 
# Re-mapping any requests for images that don't exist to the closest neighbor that does exist.

replacements = {
    # ontology
    'ontology2.jpg': 'ontology1.jpg',
    'ontology3.jpg': 'ontology1.jpg',
    'ontology4.jpg': 'ontology1.jpg',
    
    # observe
    'observe3.jpg': 'observe2.jpg',
    'observe4.jpg': 'observe2.jpg',
    
    # chatexpert
    'chatexpert2.jpg': 'chatexpert1.jpg',
    'chatexpert3.jpg': 'chatexpert1.jpg',
    'chatexpert4.jpg': 'chatexpert1.jpg',
    
    # decide
    'decide3.jpg': 'decide2.jpg',
    'decide4.jpg': 'decide2.jpg',
    'decide5.jpg': 'decide2.jpg',
    
    # deliver
    'deliver6.png': 'deliver5.png',
    'deliver6.jpg': 'deliver5.png',
    
    # observability
    'observability2.jpg': 'observability1.jpg'
}

for old, new in replacements.items():
    text = text.replace(old, new)


with open(file_path, 'w') as f:
    f.write(text)
print("Image map fixed!")
