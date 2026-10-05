#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сборка одиночного HTML: инлайнит project.bundle.js + все ассеты в base64."""
import base64, os, re, sys

ROOT = r"C:/Users/user/Documents/Гермес/games/shooter-template"
BUNDLE = os.path.join(ROOT, "build", "project.bundle.js")
HTML = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "СИЛА_СЛОВА.html")

# mime по расширению
def mime(p):
    e = os.path.splitext(p)[1].lower()
    return {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".webp": "image/webp", ".gif": "image/gif", ".wav": "audio/wav",
            ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".css": "text/css"}.get(e, "application/octet-stream")

with open(BUNDLE, "r", encoding="utf-8", errors="replace") as f:
    js = f.read()

# найти все ссылки на ассеты 'assets/....' внутри строк JS и заменить на data: URI
asset_map = {}
for m in re.finditer(r"['\"]assets/([^'\"]+\.(?:png|jpg|jpeg|webp|gif|wav|mp3|ogg|css))['\"]", js):
    name = m.group(1)
    path = os.path.join(ROOT, "assets", name)
    if os.path.exists(path) and name not in asset_map:
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        asset_map[name] = "data:%s;base64,%s" % (mime(path), b64)

print("Ассетов найдено:", len(asset_map))
for k in asset_map:
    print(" ", k)

for name, uri in asset_map.items():
    js = js.replace("'assets/%s'" % name, "'%s'" % uri)
    js = js.replace('"assets/%s"' % name, '"%s"' % uri)

# базовый index.html
with open(HTML, "r", encoding="utf-8") as f:
    idx = f.read()

# защита от обрыва инлайн-тега: экранируем '</script>' внутри JS
js = js.replace("</script>", "<\\/script>")

# вставить бандл инлайн перед </body>
inline = idx.replace('<script src="build/project.bundle.js" charset="utf-8"></script>',
                     "<script charset=\"utf-8\">\n" + js + "\n</script>")

# viewport для мобильных
if 'name="viewport"' not in inline:
    inline = inline.replace("<head>", "<head>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\">")

with open(OUT, "w", encoding="utf-8") as f:
    f.write(inline)

size = os.path.getsize(OUT) / 1024 / 1024
print("Готово: %s (%.2f MB)" % (OUT, size))

# проверить, что не осталось внешних ссылок на ассеты
left = re.findall(r"['\"]assets/[^'\"]+['\"]", js)
print("Осталось внешних assets-ссылок в JS:", len(left))
