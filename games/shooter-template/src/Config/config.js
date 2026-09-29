/* eslint-disable no-undef */

import 'phaser';

export default {
  type: Phaser.CANVAS,
  width: 1024,
  height: 640,
  backgroundColor: 'black',
  // Если контейнера нет в DOM (офлайн-сборка), Phaser сам создаёт canvas
  // и вставляет его в document.body — раньше здесь был несуществующий
  // 'main-container' и страница оставалась чёрной.
  parent: (typeof document !== 'undefined' && document.getElementById('game-container'))
    || (typeof document !== 'undefined' ? document.body : undefined),
  dom: {
    createContainer: true,
  },
  loader: {
    crossOrigin: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  pixelArt: true,
  roundPixels: true,
};
