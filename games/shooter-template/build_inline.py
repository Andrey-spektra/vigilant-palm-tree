import base64
import os

root = r"C:\Users\user\Documents\Гермес\games\shooter-template"
bundle_path = os.path.join(root, "build", "project.bundle.js")

js = open(bundle_path, "r", encoding="utf-8").read()

paths = sorted({
    "assets/bg-city.png",
    "assets/Background-3.png",
    "assets/cover.png",
    "assets/score-gopnik.png",
    "assets/sprEnemy0v2.png",
    "assets/sprEnemy1.png",
    "assets/sprEnemy2.png",
    "assets/sprExplosion.png",
    "assets/sprLaserEnemy0.png",
    "assets/sprLaserPlayer.png",
    "assets/sprMat.png",
    "assets/sprPlayer.png",
    "assets/sprWord.png",
    "assets/sndExplode0.wav",
    "assets/sndExplode1.wav",
    "assets/sndLaser.wav",
})

mime = {".png": "image/png", ".wav": "audio/wav"}

for rel in paths:
    abs_path = os.path.join(root, *rel.split("/"))
    if not os.path.exists(abs_path):
        print("MISSING:", rel)
        continue
    b64 = base64.b64encode(open(abs_path, "rb").read()).decode("ascii")
    data_uri = "data:{};base64,{}".format(mime[os.path.splitext(rel)[1].lower()], b64)
    count = js.count("'" + rel + "'") + js.count('"' + rel + '"')
    js = js.replace("'" + rel + "'", "'" + data_uri + "'")
    js = js.replace('"' + rel + '"', '"' + data_uri + '"')
    print("{}x {}".format(count, rel))

head = (
    '<!DOCTYPE html>\n'
    '<html lang="ru">\n'
    '    <head>\n'
    '        <meta charset="utf-8">\n'
    '        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\n'
    '        <title>Сила слова</title>\n'
    '        <style>\n'
    '            html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }\n'
    '        </style>\n'
    '    </head>\n'
    '    <body>\n'
    '        <script charset="utf-8">\n'
)

html = head + js + '\n        </script>\n    </body>\n</html>\n'

out = os.path.join(root, "СИЛА_СЛОВА_игра.html")
open(out, "w", encoding="utf-8").write(html)
print("WROTE", out, len(html) // 1024, "KB")
