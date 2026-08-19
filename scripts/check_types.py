import re

with open('src/data/indicators.js', 'r', encoding='utf-8') as f:
    text = f.read()

# find all "id": "...", "type": "..."
matches = re.findall(r'"id":\s*"([^"]+)",\s*"type":\s*"([^"]+)"', text)
print(f"Found {len(matches)} indicators:")
for ind_id, ind_type in matches:
    print(f" - {ind_id}: {ind_type}")
