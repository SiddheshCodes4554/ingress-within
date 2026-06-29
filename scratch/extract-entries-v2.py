import os
import json
import re

transcript_paths = [
    r"C:\Users\siddh\.gemini\antigravity\brain\948714a0-b526-4e4b-964c-fc6829bd3df4\.system_generated\logs\transcript_full.jsonl",
    r"C:\Users\siddh\.gemini\antigravity\brain\948714a0-b526-4e4b-964c-fc6829bd3df4\.system_generated\logs\transcript.jsonl"
]

print("Scanning transcript files...")

entry_pattern = re.compile(
    r'(?:\{[^{}]*?"id"\s*:\s*?"([a-f0-9\-]{36})"[^{}]*?"content"\s*:\s*?"(.*?)"[^{}]*?\})|'
    r'(?:\{[^{}]*?"content"\s*:\s*?"(.*?)"[^{}]*?"id"\s*:\s*?"([a-f0-9\-]{36})"[^{}]*?\})',
    re.DOTALL
)

recovered_entries = {}

for path in transcript_paths:
    if not os.path.exists(path):
        continue
    print(f"Reading {path}...")
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                # Search for JSON blocks inside the text
                # Find all UUIDs first to focus
                for m in re.finditer(r'([a-f0-9\-]{36})', line):
                    uuid = m.group(1)
                    # Let's find if there is a 'content' key near it (within 1000 characters)
                    start = max(0, m.start() - 1000)
                    end = min(len(line), m.end() + 1000)
                    window = line[start:end]
                    
                    if 'content' in window and ('user_id' in window or 'cycle_id' in window or 'created_at' in window):
                        # Try to find a JSON object containing the UUID
                        # We can extract the potential JSON object around it
                        # Let's look for '{' and '}'
                        obj_matches = re.finditer(r'\{[^{}]*?\}', window)
                        for obj_m in obj_matches:
                            obj_str = obj_m.group(0)
                            if uuid in obj_str and ('content' in obj_str or 'entry_text' in obj_str):
                                try:
                                    # Normalize JSON-like single quotes to double quotes
                                    normalized = obj_str.replace("'", '"')
                                    # Fix unquoted keys if any, but let's try direct load first
                                    parsed = json.loads(normalized)
                                    if parsed.get('id') == uuid or 'content' in parsed:
                                        recovered_entries[uuid] = parsed
                                except:
                                    # Try a fallback regex parsing
                                    id_m = re.search(r'["\']?id["\']?\s*:\s*["\']([a-f0-9\-]{36})["\']', obj_str)
                                    content_m = re.search(r'["\']?content["\']?\s*:\s*["\'](.*?)["\']', obj_str)
                                    created_m = re.search(r'["\']?created_at["\']?\s*:\s*["\'](.*?)["\']', obj_str)
                                    user_m = re.search(r'["\']?user_id["\']?\s*:\s*["\']([a-f0-9\-]{36})["\']', obj_str)
                                    cycle_m = re.search(r'["\']?cycle_id["\']?\s*:\s*["\']([a-f0-9\-]{36})["\']', obj_str)
                                    
                                    if content_m:
                                        recovered_entries[uuid] = {
                                            'id': uuid,
                                            'content': content_m.group(1),
                                            'created_at': created_m.group(1) if created_m else None,
                                            'user_id': user_m.group(1) if user_m else 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
                                            'cycle_id': cycle_m.group(1) if cycle_m else None
                                        }
    except Exception as e:
        print(f"Error: {e}")

print(f"Recovered {len(recovered_entries)} entries.")
for uuid, entry in recovered_entries.items():
    print(f"UUID: {uuid}")
    print(f"Date: {entry.get('created_at') or entry.get('created')}")
    print(f"Snippet: {str(entry.get('content'))[:100]}")
    print("-" * 60)

output_path = r"D:\Internship\Ingress Within\scratch\recovered_entries_v2.json"
with open(output_path, 'w', encoding='utf-8') as out:
    json.dump(list(recovered_entries.values()), out, indent=2)
print(f"Saved to {output_path}")
