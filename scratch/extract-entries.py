import os
import json
import re

transcript_path = r"C:\Users\siddh\.gemini\antigravity\brain\948714a0-b526-4e4b-964c-fc6829bd3df4\.system_generated\logs\transcript_full.jsonl"
if not os.path.exists(transcript_path):
    transcript_path = r"C:\Users\siddh\.gemini\antigravity\brain\948714a0-b526-4e4b-964c-fc6829bd3df4\.system_generated\logs\transcript.jsonl"

print(f"Reading transcript from {transcript_path}...")

unique_entries = {}

try:
    with open(transcript_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            # Search for JSON-like strings representing database entry rows
            # We look for user_id and content
            # Quick check to see if user_id is in the line
            if 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7' not in line:
                continue
                
            # Find all JSON-like objects in the line
            # Let's search for patterns like {"id": "...", "content": "..."} or similar
            # Since the line itself is a JSON step, let's load it
            try:
                step = json.loads(line)
                step_str = json.dumps(step)
                
                # Search for entry-like patterns in the step content
                # An entry has: id (UUID), user_id, cycle_id, content
                # Let's search for objects with "content" and "cycle_id"
                # We can extract all dictionaries recursively
                def extract_entries_dict(obj):
                    if isinstance(obj, dict):
                        if 'content' in obj and 'cycle_id' in obj and obj.get('user_id') == 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7':
                            ent_id = obj.get('id')
                            if ent_id:
                                unique_entries[ent_id] = obj
                        for k, v in obj.items():
                            extract_entries_dict(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            extract_entries_dict(item)
                            
                extract_entries_dict(step)
            except Exception as e:
                # Fallback to regex if json loading fails
                pass
except Exception as e:
    print(f"Error reading transcript: {e}")

print(f"Found {len(unique_entries)} unique journal entries in logs.")
for ent_id, entry in unique_entries.items():
    print(f"ID: {ent_id}")
    print(f"Date: {entry.get('created_at') or entry.get('written_at')}")
    print(f"Snippet: {entry.get('content')[:100]}...")
    print("-" * 50)

# Save recovered entries
output_path = r"D:\Internship\Ingress Within\scratch\recovered_entries.json"
with open(output_path, 'w', encoding='utf-8') as out:
    json.dump(list(unique_entries.values()), out, indent=2)
print(f"Recovered entries saved to {output_path}")
