/* eslint-disable no-undef */

import 'phaser';

export default class SceneMainMenu extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneMainMenu',
    });
  }

  preload() {
    this.load.image('deepspace-menu', 'assets/Background-3.png');
  }

  create() {
    this.bg = this.add.image(512, 320, 'deepspace-menu');
    this.title = this.add.text(this.game.config.width * 0.5, 128, 'СИЛА СЛОВА', {
      fontFamily: 'monospace',
      fontSize: 48,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    });
    this.title.setOrigin(0.5);
    this.subtitle = this.add.text(this.game.config.width * 0.5, 175, 'Автор игры — Андрей Шитиков', {
      fontFamily: 'monospace',
      fontSize: 20,
      fontStyle: 'bold',
      color: '#9fd8ff',
      align: 'center',
    });
    this.subtitle.setOrigin(0.5);

    const play = document.createElement('div');
    play.innerHTML = `<button type='submit' id='play'
    style='background-color: transparent;
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.5rem;
    margin-left: 3.5rem;
    text-transform: uppercase;
    font-weight: bold;'>
    В бой</button>`;
    this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.45, play, 'background-color: transparent; width: 220px; height: 0; font: 48px Arial');

    const top = document.createElement('div');
    top.innerHTML = `<button type='submit' id='topscores'
    style='background-color: transparent;
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.5rem;
    margin-left: 3.5rem;
    text-transform: uppercase;
    font-weight: bold;'>
    Рекорды</button>`;
    this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.55, top, 'background-color: transparent; width: 220px; height: 0; font: 48px Arial');

    const topBtn = document.getElementById('topscores');
    const playBtn = document.getElementById('play');

    playBtn.onclick = () => this.scene.start('SceneIntro');
    topBtn.onclick = () => this.scene.start('SceneTopScores');
  }
}
