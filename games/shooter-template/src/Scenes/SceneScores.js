/* eslint-disable no-undef */

import 'phaser';

const Storage = require('../modules/storage');

export default class SceneScores extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneScores',
    });
  }

  preload() {}

  create() {
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.W);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.S);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.A);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.D);

    // фон — город, справа — гопник, читающий книгу
    this.bg = this.add.image(512, 320, 'deepspace');
    this.bg.setScale(Math.max(this.game.config.width / this.bg.width, this.game.config.height / this.bg.height));

    this.gopnik = this.add.image(this.game.config.width * 0.85, this.game.config.height * 0.62, 'score-gopnik');
    this.gopnik.setScale(0.38);

    const currentScore = Storage.getCurrentScore();

    // случайная финальная фраза
    const endPhrases = [
      'Конец истории',
      'Закончилась твоя сказка',
      'Ты всё сказал',
      'Твои книги закончены',
    ];
    this.title = this.add.text(this.game.config.width * 0.38, 100, endPhrases[Phaser.Math.Between(0, endPhrases.length - 1)], {
      fontFamily: 'monospace',
      fontSize: 44,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'left',
    });
    this.title.setOrigin(0, 0.5);

    this.score = this.add.text(this.game.config.width * 0.38, 210, `Твои новые читатели: ${currentScore}`, {
      fontFamily: 'monospace',
      fontSize: 40,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'left',
    });
    this.score.setOrigin(0, 0.5);

    const div = document.createElement('div');
    div.innerHTML = `<button type='submit' id='button'
    style='background-color: rgba(12, 17, 28, 0.92);
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.6rem 1.2rem;
    text-transform: uppercase;
    font-family: Arial, sans-serif;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;'>
    В меню</button>`;
    this.add.dom(this.game.config.width * 0.38, this.game.config.height * 0.75, div, 'background-color: transparent; width: 220px; height: 0;');

    const btn = document.getElementById('button');
    btn.onclick = () => {
      Storage.setGameFinished(true);
      this.scene.start('SceneMainMenu');
    };
  }
}
