// Одноразовая сборка: рабочий файл, стартующий сразу во 2-й главе (Поклонница).
// Не коммитится — артефакт рабочей директории.
const fs = require('fs');
const path = require('path');

const root = __dirname;
const bundlePath = path.join(root, 'build', 'project.bundle.js');
let js = fs.readFileSync(bundlePath, 'utf8');

// Стартовая строка в минифицированном бандле (src/index.js):
//   this.scene.add("SceneMain",R),this.scene.start("SceneMainMenu")
// Меняем target старта на SceneMain и подставляем данные главы 2
// (create(data) принимает {chapter:2}, Phaser start(key, data) поддерживает).
const NEEDLE = 'this.scene.add("SceneMain",R),this.scene.start("SceneMainMenu")';
const REPLACEMENT = 'this.scene.add("SceneMain",R),this.scene.start("SceneMain",{chapter:2})';
if (!js.includes(NEEDLE)) {
  console.error('Не найдена стартовая строка бандла — пересоберите npm run build.');
  process.exit(1);
}
const patched = js.replace(NEEDLE, REPLACEMENT);

// Проверка синтаксиса пропатченного бандля до записи в HTML.
new Function(patched);

// Base64-манифест ассетов (как в make_offline.py), читаем реестр src/Config/assets.js
const assetsSrc = fs.readFileSync(path.join(root, 'src', 'Config', 'assets.js'), 'utf8');
const entryRe = /['"]?([A-Za-z0-9_-]+)['"]?\s*:\s*\{\s*file:\s*'([^']+)',\s*type:\s*'([a-z]+)'([^}]*)\}/g;
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const manifest = {};
let e;
while ((e = entryRe.exec(assetsSrc)) !== null) {
  const [ , key, fpath, ftype, rest ] = e;
  const abs = path.join(root, ...fpath.split('/'));
  if (!fs.existsSync(abs)) { console.log('MISSING:', fpath); continue; }
  const b64 = fs.readFileSync(abs).toString('base64');
  const item = { base64: b64, file: fpath, type: ftype };
  const fw = rest.match(/frameWidth:\s*(\d+)/);
  const fh = rest.match(/frameHeight:\s*(\d+)/);
  if (fw && fh) { item.frameWidth = +fw[1]; item.frameHeight = +fh[1]; }
  manifest[key] = item;
}
console.log('Ассетов в манифесте:', Object.keys(manifest).length);

const pre = '<script id="game-assets-manifest">window.__GAME_ASSETS_MANIFEST__=' +
  JSON.stringify(manifest) + ';</script>';

const html = `<!DOCTYPE html>
<html lang="ru">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <title>Сила слова — Глава 2 (Поклонница)</title>
        <style>
            html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
            canvas { display: block; }
        </style>
    </head>
    <body>
${pre}
<script charset="utf-8">
${patched.replace(/<\/script>/gi, '<\\/script>')}
</script>
    </body>
</html>
`;

const out = path.join(root, 'СИЛА_СЛОВА_глава2.html');
fs.writeFileSync(out, html, 'utf8');
console.log('WROTE', out, Math.round(html.length / 1024), 'KB');
