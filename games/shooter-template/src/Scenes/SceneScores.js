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

  create(data) {
    // Убираем свои DOM-кнопки при выходе из сцены, чтобы они не оставались поверх других сцен.
    this.events.once('shutdown', () => {
      document.querySelectorAll('#button').forEach((el) => el.remove());
    });
    const chapter = (data && data.chapter) || 1;
    const showEpilogue = Boolean(data && data.showEpilogue);
    // Автор — женщина: её спрайт на экране итогов вместо поклонницы.
    const femaleAuthor = Boolean(data && data.femaleAuthor);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.W);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.S);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.A);
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.D);

    // фон — город, справа — гопник (глава 1) или поклонница (глава 2), читающий книгу
    this.bg = this.add.image(512, 320, 'deepspace');
    this.bg.setScale(Math.max(this.game.config.width / this.bg.width, this.game.config.height / this.bg.height));

    if (chapter === 2) {
      if (femaleAuthor) {
        // Автор-женщина: показываем её саму (кадр спрайт-листа писательницы).
        this.fan = this.add.sprite(this.game.config.width * 0.85, this.game.config.height * 0.62, 'sprPlayerFemale', 0);
      } else {
        this.fan = this.add.image(this.game.config.width * 0.85, this.game.config.height * 0.62, 'score-fan');
      }
      this.fan.setScale(0.9);
    } else {
      this.gopnik = this.add.image(this.game.config.width * 0.85, this.game.config.height * 0.62, 'score-gopnik');
      this.gopnik.setScale(0.38);
    }

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

    if (showEpilogue) {
      this.add.text(this.game.config.width * 0.38, 275, 'Невысказанное', {
        fontFamily: 'Arial, sans-serif',
        fontSize: 25,
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      this.add.text(
        this.game.config.width * 0.38,
        307,
        'Однажды он прочитал, что самое прекрасное — это невысказанное, то, чего нельзя описать словами.\n\nПосле этого понял, что пишет великолепно.',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          lineSpacing: 2,
          color: '#ffffff',
          wordWrap: { width: this.game.config.width * 0.43 },
        },
      ).setOrigin(0, 0);

      this.add.text(this.game.config.width * 0.38, 425, 'Андрей Шитиков', {
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        color: '#ffffff',
      }).setOrigin(0, 0.5);
    }

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
