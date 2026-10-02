// Одноразовая сборка: ОДИН запускающий файл с ДВУМЯ главами.
// Глава 1: автор (sprPlayer) бьётся с гопниками (sprEnemy0).
// Глава 2: автор (тот же sprPlayer) бьётся с ПОКЛОННИЦАМИ (враги на спрайте sprFan,
//          реплики поклонниц — «Где моя прода?», «Автор гений» и т.д.).
// Старт сразу в Главе 1; по истечении таймера — автоматический переход в Главу 2,
// затем экран итогов. Патчи накладываются на актуальный build/project.bundle.js
// строковыми якорями (см. src/entities.js GunShip / src/index.js).
const fs = require('fs');
const path = require('path');

const root = __dirname;
let js = fs.readFileSync(path.join(root, 'build', 'project.bundle.js'), 'utf8');

function mustReplace(needle, repl, label) {
  if (!js.includes(needle)) { console.error('НЕ НАЙДЕН якорь:', label); process.exit(1); }
  js = js.replace(needle, repl);
}

// 1) Точка входа НЕ трогаем: игра стартует с главного меню, где игрок
//    выбирает персонажа (Автор-мужчина / Авторша). Выбор сохраняется в
//    localStorage и window.__GAME_CHARACTER__ — см. src/modules/storage.js.
//    Поэтому патч «старт сразу с Главы 1» отменён.

// 2) Враг Главы 2: спрайт/анимация поклонницы вместо гопника (s — аргумент chapter).
mustReplace(
  'super(t,e,i,"sprEnemy0","GunShip");const r=0===s||null==s?1:s;this.play("sprEnemy0")',
  'super(t,e,i,2===s?"sprFan":"sprEnemy0","GunShip");const r=0===s||null==s?1:s;this.play(2===s?"sprFan":"sprEnemy0")',
  'конструктор GunShip (текстура+анимация)');

// 2b) Снаряд поклонницы — «Ещё» (sprEsho), а не мат (sprMat).
//     EnemyLaser (v): конструктор получает 5-й аргумент с текстурой (имя o, не занято в скоупе).
mustReplace(
  'class v extends f{constructor(t,e,i,s){super(t,e,i,"sprMat");const n=0===s||null==s?1:s;',
  'class v extends f{constructor(t,e,i,s,o){super(t,e,i,o||"sprMat");const n=0===s||null==s?1:s;',
  'конструктор EnemyLaser (текстура снаряда)');
mustReplace(
  'i=new v(this.scene,t,e,this.dir);',
  'i=new v(this.scene,t,e,this.dir,!0===this.isFanEnemy&&2===P?"sprEsho":null);',
  'выстрел врага (поклонница стреляет «Ещё»)');

// 2c) Игроком обеих глав остаётся ВЫБРАННЫЙ в меню Автор (sprPlayer — мужчина
//     или sprAuthorFemale — женщина). В Главе 2 он стреляет словом «Ещё»
//     (флаг fanWords), поэтому спрайт поклонницы игроку не подставляем.
if (js.includes('2===P?"sprFan":"sprPlayer"')) {
  js = js.replace('2===P?"sprFan":"sprPlayer"', '"sprPlayer"');
}

// 3) Заголовок Главы 2 под новую схему (автор против поклонниц).
if (js.includes('"Глава 2 — поклонница говорит «Ещё»"')) {
  js = js.replace('"Глава 2 — поклонница говорит «Ещё»"', '"Глава 2 — автор против поклонниц"');
}

// Проверка синтаксиса пропатченного бандля до записи в HTML.
new Function(js);

// Base64-манифест ассетов (как make_offline.py), читаем реестр src/Config/assets.js
const assetsSrc = fs.readFileSync(path.join(root, 'src', 'Config', 'assets.js'), 'utf8');
const entryRe = /['"]?([A-Za-z0-9_-]+)['"]?\s*:\s*\{\s*file:\s*'([^']+)',\s*type:\s*'([a-z]+)'([^}]*)\}/g;
const manifest = {};
let e;
while ((e = entryRe.exec(assetsSrc)) !== null) {
  const [ , key, fpath, ftype, rest ] = e;
  const abs = path.join(root, ...fpath.split('/'));
  if (!fs.existsSync(abs)) { console.log('MISSING:', fpath); continue; }
  const item = { base64: fs.readFileSync(abs).toString('base64'), file: fpath, type: ftype };
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
        <title>Сила слова — две главы</title>
        <style>
            html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
            canvas { display: block; }
        </style>
    </head>
    <body>
${pre}
<script charset="utf-8">
${js.replace(/<\/script>/gi, '<\\/script>')}
</script>
    </body>
</html>
`;

const out = path.join(root, 'СИЛА_СЛОВА_две_главы.html');
fs.writeFileSync(out, html, 'utf8');
console.log('WROTE', out, Math.round(html.length / 1024 / 1024 * 10) / 10, 'MB');
