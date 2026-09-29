/* eslint-disable no-undef */

// Реестр ассетов. На сервере (dev :8800) используется поле `file` (реальный путь).
// Оффлайн-сборка подменяет `file` на `base64` до старта игры — см. assetLoader.js.
export default {
  deepspace:          { file: 'assets/bg-city.png',     type: 'image' },
  'deepspace-2':      { file: 'assets/bg-city.png',     type: 'image' },
  'deepspace-3':      { file: 'assets/bg-city.png',     type: 'image' },
  'deepspace-scores': { file: 'assets/bg-city.png',     type: 'image' },
  cover:              { file: 'assets/cover.png',       type: 'image' },
  'score-gopnik':     { file: 'assets/score-gopnik.png', type: 'image' },
  sprWord:            { file: 'assets/sprWord.png',     type: 'image' },
  sprMat:             { file: 'assets/sprMat.png',      type: 'image' },
  sprPlayer:          { file: 'assets/sprPlayer.png',   type: 'spritesheet', frameWidth: 89, frameHeight: 160 },
  sprEnemy0:          { file: 'assets/sprEnemy0v2.png', type: 'spritesheet', frameWidth: 122, frameHeight: 160 },
  sprExplosion:       { file: 'assets/sprExplosion.png', type: 'spritesheet', frameWidth: 32, frameHeight: 32 },
};
