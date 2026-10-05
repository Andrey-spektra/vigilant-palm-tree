# -*- coding: utf-8 -*-
"""Сборка офлайн-версий игры «Сила слова».

1) СИЛА_СЛОВА_игра.html — один файл: Phaser + код игры + base64 манифест ассетов.
   (Раньше скрипт подменял строки 'assets/...' внутри бандля на гигантские
   data-URI прямо в коде — это ломало сборку и тормозило парсер браузера.)
2) сила_слова_оффлайн/index.html — папка с обычными путями к assets/.

Запускать после npm run build (или python build_game.py).
"""
import base64
import json
import os
import shutil

root = os.path.dirname(os.path.abspath(__file__))
bundle_path = os.path.join(root, "build", "project.bundle.js")
js = open(bundle_path, encoding="utf-8").read()

mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg"}

# --- собираем base64-манифест из src/Config/assets.js -----------------------
import re as _re
src_assets = open(os.path.join(root, "src", "Config", "assets.js"), encoding="utf-8").read()
entries = _re.findall(
    r"['\"]?([A-Za-z0-9_-]+)['\"]?\s*:\s*\{\s*file:\s*'([^']+)',\s*type:\s*'([a-z]+)'([^}]*)\}",
    src_assets)

manifest = {}
for key, fpath, ftype, rest in entries:
    abs_path = os.path.join(root, *fpath.split("/"))
    if not os.path.exists(abs_path):
        print("MISSING:", fpath)
        continue
    ext = os.path.splitext(fpath)[1].lower()
    b64 = base64.b64encode(open(abs_path, "rb").read()).decode("ascii")
    e = {"base64": b64, "file": fpath, "type": ftype}
    fw = _re.search(r"frameWidth:\s*(\d+)", rest)
    fh = _re.search(r"frameHeight:\s*(\d+)", rest)
    if fw and fh:
        e["frameWidth"] = int(fw.group(1))
        e["frameHeight"] = int(fh.group(1))
    manifest[key] = e
    print("embedded", fpath, len(b64) // 1024, "KB b64")

pre = "<script id=\"game-assets-manifest\">" \
      "window.__GAME_ASSETS_MANIFEST__=" + json.dumps(manifest) + ";</script>"

head = (
    '<!DOCTYPE html>\n'
    '<html lang="ru">\n'
    '    <head>\n'
    '        <meta charset="utf-8">\n'
    '        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\n'
    '        <title>Сила слова</title>\n'
    '        <style>\n'
    '            html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }'
    '            canvas { display: block; }\n'
    '        </style>\n'
    '    </head>\n'
    '    <body>\n'
)

tail = '\n    </body>\n</html>\n'

html = head + pre + '\n<script charset="utf-8">\n' + js + '\n</script>\n' + tail
out = os.path.join(root, "СИЛА_СЛОВА_игра.html")
open(out, "w", encoding="utf-8").write(html)
print("WROTE", out, len(html) // 1024, "KB")

# --- лёгкая офлайн-папка -----------------------------------------------------
outdir = os.path.join(root, "сила_слова_оффлайн")
shutil.rmtree(outdir, ignore_errors=True)
os.makedirs(outdir)
shutil.copytree(os.path.join(root, "assets"), os.path.join(outdir, "assets"))
html2 = head + '\n<script charset="utf-8">\n' + js + '\n</script>\n' + tail
open(os.path.join(outdir, "index.html"), "w", encoding="utf-8").write(html2)
print("WROTE", outdir)
