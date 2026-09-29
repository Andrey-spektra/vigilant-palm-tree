import os
import shutil

root = r"C:\Users\user\Documents\Гермес\games\shooter-template"
outdir = r"C:\Users\user\Documents\Гермес\games\shooter-template\сила_слова_оффлайн"

os.makedirs(outdir, exist_ok=True)
shutil.rmtree(outdir, ignore_errors=True)
os.makedirs(outdir, exist_ok=True)

# assets
shutil.copytree(os.path.join(root, "assets"), os.path.join(outdir, "assets"))

# бандл — обычные пути
bundle = open(os.path.join(root, "build", "project.bundle.js"), encoding="utf-8").read()

html = (
    '<!DOCTYPE html>\n'
    '<html lang="ru">\n'
    '    <head>\n'
    '        <meta charset="utf-8">\n'
    '        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\n'
    '        <title>Сила слова</title>\n'
    '    </head>\n'
    '    <body>\n'
    '        <script charset="utf-8">\n'
    + bundle +
    '\n        </script>\n    </body>\n</html>\n'
)
open(os.path.join(outdir, "index.html"), "w", encoding="utf-8").write(html)
print("wrote", outdir, "size", len(html)//1024, "KB")
