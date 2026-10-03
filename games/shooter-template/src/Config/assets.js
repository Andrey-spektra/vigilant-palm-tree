/* eslint-disable no-undef */

// Реестр ассетов. На сервере (dev :8800) используется поле `file` (реальный путь).
// Оффлайн-сборка подменяет `file` на `base64` до старта игры — см. assetLoader.js.
export default {
  // Одна глава: все фоны используют ключ 'deepspace' — в оффлайн-сборку
  // картинка bg-city.png попадает ОДИН раз (раньше дублировалась 5 раз).
  deepspace:          { file: 'assets/bg-city.png',     type: 'image' },
  cover:              { file: 'assets/cover.png',       type: 'image' },
  'score-gopnik':     { file: 'assets/score-gopnik.png', type: 'image' },
  sprWord:            { file: 'assets/sprWord.png',     type: 'image' },
  sprMat:             { file: 'assets/sprMat.png',      type: 'image' },
  sprPlayer:          { file: 'assets/sprPlayer.png',   type: 'spritesheet', frameWidth: 89, frameHeight: 160 },
  // Писательница — женский вариант героя (5 кадров по 89x160)
  sprPlayerFemale:    { file: 'assets/sprPlayerFemale.png', type: 'spritesheet', frameWidth: 89, frameHeight: 160 },
  // Поклонница — игрок второй главы (спрайт-лист собран из файлов 1..5)
  sprFan:             { file: 'assets/sprFan.png',      type: 'spritesheet', frameWidth: 89, frameHeight: 160 },
  // Слово поклонницы «Ещё» (снаряд второй главы)
  sprEsho:            { file: 'assets/sprEsho.png',     type: 'image' },
  // Поклонница на экране итогов второй главы
  'score-fan':        { file: 'assets/score-fan.png',   type: 'image' },
  sprEnemy0:          { file: 'assets/sprEnemy0v2.png', type: 'spritesheet', frameWidth: 122, frameHeight: 160 },
  sprExplosion:       { file: 'assets/sprExplosion.png', type: 'spritesheet', frameWidth: 32, frameHeight: 32 },
  // Звуки (возвращены в игру; воспроизводятся через безопасный проигрыватель window.SFX)
  sndLaser:           { file: 'assets/sndLaser.wav',     type: 'audio' },
  sndExplode0:        { file: 'assets/sndExplode0.wav',  type: 'audio' },
  sndExplode1:        { file: 'assets/sndExplode1.wav',  type: 'audio' },
};
