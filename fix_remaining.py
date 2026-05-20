import sys
with open('ar/news.html', 'r', encoding='utf-8') as f:
    content = f.read()
if 'src="site-content.js"' in content:
    content = content.replace('src="site-content.js"', 'src="../site-content.js"')
    with open('ar/news.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed ar/news.html")

with open('ar/product/beam.html', 'r', encoding='utf-8') as f:
    content = f.read()
if 'href="ar-02.html"' in content:
    content = content.replace('href="ar-02.html"', 'href="#"')
    with open('ar/product/beam.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed ar/product/beam.html")
