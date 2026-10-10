/* eslint-disable no-undef */

// Реестр ассетов. На сервере (dev :8800) используется поле `file` (реальный путь).
// Оффлайн-сборка подменяет `file` на `base64` до старта игры — см. assetLoader.js.
export default {
  // Одна глава: все фоны используют ключ 'deepspace' — в оффлайн-сборку
  // картинка bg-city.png попадает ОДИН раз (раньше дублировалась 5 раз).
  deepspace:          { file: 'assets/bg-city.png',     type: 'image' },
  cover:              { file: 'assets/cover.png',       type: 'image' },
  'score-gopnik':     { file: 'assets/score-gopnik.png', type: 'image' },
  sprWord:            { file: 'assets/sprWord.png',      type: 'image' },
  sprMat:              { file: 'assets/sprMat.png',      type: 'image' },
  sprPlayer:          { file: 'assets/sprPlayer.png',   type: 'spritesheet', frameWidth: 89, frameHeight: 160 },
  sprEnemy0:          { file: 'assets/sprEnemy0v2.png', type: 'spritesheet', frameWidth: 122, frameHeight: 160 },
  sprCritic:          { file: 'assets/sprCritic.png',   type: 'spritesheet', frameWidth: 721, frameHeight: 1215 },
  // Писательница — женский вариант героя (5 кадров по 118x160)
  sprPlayerFemale:    { file: 'assets/sprPlayerFemale.png', type: 'spritesheet', frameWidth: 118, frameHeight: 160 },
  // Поклонник — враг второй главы (5 кадров из файлов 2.1–2.5)
  sprFan:             { file: 'assets/sprFan.png',      type: 'spritesheet', frameWidth: 705, frameHeight: 1308 },
  // Прежняя поклонница остаётся для мужского автора.
  sprFanFemale:       { file: 'assets/sprFanFemale.png', type: 'spritesheet', frameWidth: 150, frameHeight: 160 },
  // Слово поклонника «Ещё» (снаряд второй главы)
  sprEsho:            { file: 'assets/sprEsho.png',     type: 'image' },
  sprExplosion:       { file: 'assets/sprExplosion.png', type: 'spritesheet', frameWidth: 32, frameHeight: 32 },
  // Звуки (возвращены в игру; воспроизводятся через безопасный проигрыватель window.SFX)
  sndLaser:           { file: 'assets/sndLaser.wav',     type: 'audio' },
  sndExplode0:        { file: 'assets/sndExplode0.wav',  type: 'audio' },
  sndExplode1:        { file: 'assets/sndExplode1.wav',  type: 'audio' },
};
