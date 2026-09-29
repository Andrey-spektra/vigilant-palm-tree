/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-use-before-define */


import 'phaser';
import config from '../Config/config';

const SubmitScore = require('../modules/submitScore');
const Storage = require('../modules/storage');

const zero = 0;

export default class SceneScores extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneScores',
    });
  }

  create() {
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.W);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.S);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.A);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.D);

    const currentScore = Storage.getCurrentScore();
    const lasthigh = Storage.getHighScore();

    // случайная финальная фраза
    const endPhrases = [
      'Конец истории',
      'Закончилась твоя сказка',
      'Ты всё сказал',
      'Твои книги закончены',
    ];
    this.title = this.add.text(this.game.config.width * 0.5, 100, endPhrases[Phaser.Math.Between(0, endPhrases.length - 1)], {
      fontFamily: 'monospace',
      fontSize: 44,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    });
    this.title.setOrigin(0.5);

    const div = document.createElement('div');
    div.innerHTML = `<input type='search' placeholder='Твоё имя' id='tag'
    style="background: transparent;
    color: white;
    border: 2px solid;
    padding: 0.5rem;"/>
    <button type='submit' id='button'
    style='background-color: transparent;
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.5rem;
    margin-left: 3.5rem;
    text-transform: uppercase;
    font-weight: bold;'>
    К рекордам</button>`;
    this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.7, div, 'background-color: transparent; width: 220px; height: 0; font: 48px Arial');

    const btn = document.getElementById('button');
    const tag = document.getElementById('tag');
    btn.onclick = () => {
      // сохранить имя, попытка отправить на сервер (необязательно — просто идём к рекордам)
      const name = tag.value || 'Аноним';
      localStorage.setItem('playerName', JSON.stringify(name));
      SubmitScore.send(name, currentScore)
        .then(() => this.scene.start('SceneTopScores'))
        .catch(() => this.scene.start('SceneTopScores'));
    };

    this.score = this.add.text(this.game.config.width * 0.5, 180, ' ', {
      fontFamily: 'monospace',
      fontSize: 40,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    });

    this.score.setOrigin(0.5);
    this.score.setText(`Твои новые читатели: ${currentScore}`);

    this.high = this.add.text(this.game.config.width * 0.5, 250, ' ', {
      fontFamily: 'monospace',
      fontSize: 30,
      fontStyle: 'bold',
      color: '#9fd8ff',
      align: 'center',
    });
    this.high.setOrigin(0.5);
    this.high.setText(`Рекорд: ${lasthigh} читателей`);
  }
}
