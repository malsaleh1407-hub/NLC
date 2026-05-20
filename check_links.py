import os
import re
from urllib.parse import urlparse

def get_links(content):
    urls = []
    # match src="..." and href="..."
    matches = re.findall(r'(?:href|src|source srcset)=["\'](.*?)["\']', content)
    for m in matches:
        # ignore external links
        if not (m.startswith('http://') or m.startswith('https://') or m.startswith('tel:') or m.startswith('mailto:') or m.startswith('data:') or m.startswith('#')):
            urls.append(m)
    return urls

missing_links = []
base_dir = os.getcwd()

for root, dirs, files in os.walk(base_dir):
    # skip .git or other ignored dirs
    if '.git' in root or '.claude' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
            
            links = get_links(content)
            for link in links:
                # remove anchor or query params
                parsed = urlparse(link)
                link_path = parsed.path
                if not link_path:
                    continue
                
                # Check if it starts with /
                if link_path.startswith('/'):
                    target_path = os.path.join(base_dir, link_path.lstrip('/'))
                else:
                    target_path = os.path.join(root, link_path)
                
                target_path = os.path.normpath(target_path)
                
                if not os.path.exists(target_path):
                    if target_path not in missing_links:
                        missing_links.append((file_path.replace(base_dir, ''), link, target_path))

for f, src, missing in missing_links:
    print(f"File {f} missing link: {src}")

