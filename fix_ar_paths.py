import os
import re

base_dir = os.getcwd()

# directories to fix (2 levels deep)
dirs_to_fix = [
    os.path.join(base_dir, 'ar', 'product'),
    os.path.join(base_dir, 'ar', 'solutions')
]

updated_count = 0

for target_dir in dirs_to_fix:
    if not os.path.exists(target_dir):
        continue
    for file in os.listdir(target_dir):
        if file.endswith('.html'):
            filepath = os.path.join(target_dir, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            # change ../images/ to ../../images/
            new_content = new_content.replace('="../images/', '="../../images/')
            new_content = new_content.replace("='../images/", "='../../images/")
            new_content = new_content.replace('url("../images/', 'url("../../images/')
            new_content = new_content.replace("url('../images/", "url('../../images/")

            # Also check for single ../fonts/ if that somehow snuck in?
            # They use ../fonts/Bizmo-Bold.woff which should be ../../fonts/
            new_content = new_content.replace('="../fonts/', '="../../fonts/')
            new_content = new_content.replace("='../fonts/", "='../../fonts/")
            new_content = new_content.replace('url("../fonts/', 'url("../../fonts/')
            new_content = new_content.replace("url('../fonts/", "url('../../fonts/")

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                updated_count += 1

print(f"Updated {updated_count} files in ar/product and ar/solutions")
