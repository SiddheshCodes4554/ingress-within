import os

search_dir = r"D:\Internship\Ingress Within Files"
query1 = "vocab"
query2 = "vocabulary"

def search():
    print(f"Searching recursively in {search_dir}...")
    for root, dirs, files in os.walk(search_dir):
        for file in files:
            if not file.endswith(('.html', '.txt', '.py', '.js', '.ts', '.json')):
                # If it's docx.txt from converted ones, search it
                if not file.endswith('.docx.txt') and not file.endswith('.txt'):
                    continue
            
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    for i, line in enumerate(f, 1):
                        if query1 in line.lower() or query2 in line.lower():
                            # Print matching file name, line number, and content
                            relpath = os.path.relpath(filepath, search_dir)
                            print(f"[{relpath}:{i}] {line.strip()[:180]}")
            except Exception as e:
                pass

search()
