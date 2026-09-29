/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import 'phaser';
import config from './Config/config';
import AssetLoader from './modules/assetLoader';
import manifest from './Config/assets';
import SceneMain from './Scenes/SceneMain';
import SceneMainMenu from './Scenes/SceneMainMenu';
import SceneScores from './Scenes/SceneScores';
import SceneIntro from './Scenes/SceneIntro';

// Стрелки и пробел не должны прокручивать страницу под игрой.
window.addEventListener('keydown', (e) => {
  const block = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'];
  if (block.indexOf(e.key) !== -1 || e.code === 'Space') {
    e.preventDefault();
  }
}, { passive: false });

// Страховка для ПРОБЕЛА: если фокус документа потерян (офлайн-файл открыт
// двойным кликом, пользователь кликнул мимо canvas и т.п.) — плагин Phaser
// Keyboard может перестать получать события и isDown по пробелу «залипает»
// в ложном состоянии. Глобальный keydown выставляет флаг резервной
// клавиатуры напрямую; keyup/blur сбрасывают его в сценах.
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
    const st = window.__GAME_KEYS__;
    if (st) st.space = true;
  }
});

// Правая кнопка мыши стреляет — контекстное меню браузера (и «кружок»-эффект) убираем.
const killCtxMenu = (e) => { e.preventDefault(); return false; };
document.addEventListener('contextmenu', killCtxMenu);
window.addEventListener('load', () => {
  if (window.game && window.game.canvas) {
    window.game.canvas.addEventListener('contextmenu', killCtxMenu);
  }
});

// Единый контейнер для canvas'а — создаём сами, чтобы не зависеть от вёрстки.
if (!document.getElementById('game-container')) {
  const c = document.createElement('div');
  c.id = 'game-container';
  document.body.appendChild(c);
}

class Game extends Phaser.Game {
  constructor() {
    super(Object.assign({}, config, { parent: 'game-container' }));
    this.input.mouse.disableContextMenu();
    this.scene.add('SceneIntro', SceneIntro);
    this.scene.add('SceneScores', SceneScores);
    this.scene.add('SceneMainMenu', SceneMainMenu);
    this.scene.add('SceneMain', SceneMain);
    this.scene.start('SceneMainMenu');
  }
}

// Оффлайн-сборка подставляет свой манифест с base64 ДО этого скрипта —
// если он уже задан, не перетираем.
if (!window.__GAME_ASSETS_MANIFEST__) {
  window.__GAME_ASSETS_MANIFEST__ = manifest;
}

// Пока декодируются ассеты (Image/AudioContext) — показываем загрузку,
// чтобы не было молча чёрного экрана.
const bootEl = document.createElement('div');
bootEl.id = 'game-loading';
bootEl.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;'
  + 'background:#000;color:#fff;font:20px Arial,sans-serif;z-index:99999;';
bootEl.textContent = 'Загрузка игры…';
document.body.appendChild(bootEl);

AssetLoader.decodeAll()
  .then(() => {
    const game = new Game();
    window.game = game;
    AssetLoader.registerToGame(game);
    if (bootEl) bootEl.remove();
  })
  .catch((err) => {
    if (bootEl) {
      bootEl.textContent = 'Ошибка загрузки: '
        + (err && err.message ? err.message : String(err));
    }
    console.error('Asset preload failed', err);
  });
