/* eslint-disable no-undef */

import 'phaser';

export default {
  type: Phaser.CANVAS,
  width: 1024,
  height: 640,
  backgroundColor: 'black',
  parent: 'main-container',
  dom: {
    createContainer: true,
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
