/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import 'phaser';
import config from './Config/config';
import AssetLoader from './modules/assetLoader';
import manifest from './Config/assets';
import SceneMain from './Scenes/SceneMain';
import SceneMainMenu from './Scenes/SceneMainMenu';
import SceneScores from './Scenes/SceneScores';
import SecondStage from './Scenes/SecondStage';
import ThirdStage from './Scenes/ThirdStage';
import SceneIntro from './Scenes/SceneIntro';

class Game extends Phaser.Game {
  constructor() {
    super(config);
    this.scene.add('SceneIntro', SceneIntro);
    this.scene.add('ThirdStage', ThirdStage);
    this.scene.add('SecondStage', SecondStage);
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
