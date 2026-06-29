import os
import json
import re

logs_dir = r"C:\Users\siddh\.gemini\antigravity\brain\948714a0-b526-4e4b-964c-fc6829bd3df4\.system_generated\logs"
output_file = r"D:\Internship\Ingress Within\scratch\recovered_entries.txt"

print(f"Scanning logs in {logs_dir}...")
recovered = []

if os.path.exists(logs_dir):
    for root, dirs, files in os.walk(logs_dir):
        for file in files:
            if file.endswith('.jsonl') or file.endswith('.log') or file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        # Search for patterns of entry text like content, decrypted text, or JSON fields
                        # Look for JSON arrays of entries or specific keys
                        matches = re.finditer(r'("content"|"entry_text"|"new_entry_text_encrypted"|content:)\s*:\s*["\']([^"\']{20,})["\']', content)
                        for m in matches:
                            recovered.append((file, m.group(0)))
                except Exception as e:
                    print(f"Error reading {file}: {e}")

print(f"Found {len(recovered)} potential matches.")
with open(output_file, 'w', encoding='utf-8') as out:
    for file, match in recovered:
        out.write(f"File: {file}\nMatch: {match}\n{'-'*40}\n")

print(f"Results written to {output_file}")
