import os
import re

base_dir = os.getcwd()

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            
            # fix ar/contact.html canonical links
            if root.endswith('/ar') or '/ar/' in root:
                new_content = new_content.replace('href="ar/contact.html"', 'href="https://nlc.com.sa/ar/contact.html"')
                new_content = new_content.replace('content="ar/contact.html"', 'content="https://nlc.com.sa/ar/contact.html"')
                new_content = new_content.replace('"ar/contact.html"', '"https://nlc.com.sa/ar/contact.html"')
                
                # fix projects.html logic
                if file == 'projects.html':
                    proj_names = ['cambridge', 'causeway', 'dammam-library', 'mouwasat', 'neom']
                    for proj in proj_names:
                        # Regex to fix href="cambridge.html" and location.href='cambridge.html'
                        new_content = re.sub(rf"href=('{proj}\.html'|\"{proj}\.html\")", f'href="../project/{proj}.html"', new_content)
                        new_content = re.sub(rf"location\.href=('{proj}\.html'|\"{proj}\.html\")", f"location.href='../project/{proj}.html'", new_content)

            # fix ../images/ in 2-level-deep directories
            # ar/product, ar/solutions, product/* if any
            if '/ar/product' in root or '/ar/solutions' in root or root.endswith('/product') or root.endswith('/solutions'):
                # Wait, product/* is 1 level deep from root, so ../images is CORRECT!
                # ar/product is 2 levels deep, so ../images is WRONG
                if '/ar/' in root:
                    # change ../images/ to ../../images/
                    new_content = new_content.replace('="../images/', '="../../images/')
                    new_content = new_content.replace("='../images/", "='../../images/")
                    new_content = new_content.replace('url("../images/', 'url("../../images/')
                    new_content = new_content.replace("url('../images/", "url('../../images/")

            # fix spelling of proyecto.png -> projecto.png
            new_content = new_content.replace('proyecto.png', 'projecto.png')

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

