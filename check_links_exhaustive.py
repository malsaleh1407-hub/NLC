import os
import re
from urllib.parse import urlparse

def get_links(content):
    urls = []
    # match src="...", href="...", srcset="...", url("...")
    matches = re.findall(r'(?:href|src|source srcset)=["\'](.*?)["\']', content)
    matches += re.findall(r'url\([\'"]?(.*?)[\'"]?\)', content)
    
    for m in matches:
        if not (m.startswith('http://') or m.startswith('https://') or m.startswith('tel:') or m.startswith('mailto:') or m.startswith('data:') or m.startswith('#')):
            urls.append(m)
    return urls

missing_links = []
base_dir = os.getcwd()

for root, dirs, files in os.walk(base_dir):
    if '.git' in root or '.claude' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.css') or file.endswith('.js'):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
            
            links = get_links(content)
            for link in links:
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
                    # ignore template placeholders
                    if '${' in link or link == '...' or link.startswith('(') or '{' in link:
                        continue
                    if (file_path, link_path, target_path) not in missing_links:
                        missing_links.append((file_path.replace(base_dir, ''), link_path, target_path))

for f, src, missing in missing_links:
    print(f"File {f} missing local file: {src}")

