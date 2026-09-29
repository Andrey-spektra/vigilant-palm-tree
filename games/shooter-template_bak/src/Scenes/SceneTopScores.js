/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-nested-ternary */

import 'phaser';
import config from '../Config/config';

const GetScore = require('../modules/getScore');

let allScores;

export default class SceneTopScores extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneTopScores',
    });
  }

  create() {
    allScores = GetScore.all().catch(() => ({ result: [] }));

    this.bg = this.add.image(512, 320, 'deepspace-menu');
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.W);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.S);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.A);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.D);

    this.title = this.add.text(this.game.config.width * 0.5, 100, 'РЕКОРДЫ', {
      fontFamily: 'monospace',
      fontSize: 48,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    });
    this.title.setOrigin(0.5);

    // показать локальный рекорд, если сервер недоступен
    const localBest = JSON.parse(localStorage.getItem('highestScore')) || 0;
    this.localBest = this.add.text(this.game.config.width * 0.5, 170,
      `Твой рекорд: ${localBest} новых читателей`, {
        fontFamily: 'monospace',
        fontSize: 22,
        fontStyle: 'bold',
        color: '#9fd8ff',
        align: 'center',
      });
    this.localBest.setOrigin(0.5);

    const div = document.createElement('div');
    div.innerHTML = `<button type='submit' id='backtomenu'
    style='background-color: transparent;
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.5rem;
    margin-left: 3.5rem;
    text-transform: uppercase;
    font-weight: bold;'>
    В меню</button>`;
    this.add.dom(this.game.config.width * 0.45, this.game.config.height * 0.8, div, 'background-color: transparent; width: 220px; height: 0; font: 48px Arial');

    const btn = document.getElementById('backtomenu');
    btn.onclick = () => window.location.reload();
  }

  update() {
    allScores.then((response) => {
      const results = response.result;
      results.sort((a, b) => ((a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0)));
      let height = 0.3;
      results.slice(0, 5).forEach((result) => {
              this.add.text(this.game.config.width * 0.5, this.game.config.height * height, `${result.user}: ${result.score} читателей`, {
                fontFamily: 'monospace',
                fontSize: 28,
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
              }).setOrigin(0.5);
              height += 0.1;
            });
    });
  }
}
