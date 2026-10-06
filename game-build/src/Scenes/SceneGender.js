/* eslint-disable no-undef */

import 'phaser';

const Storage = require('../modules/storage');

// Сцена выбора пола персонажа: автор — мужчина или автор — женщина.
// Выбор сохраняется в localStorage и используется в обеих главах игры.
export default class SceneGender extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneGender',
    });
  }

  preload() {}

  create() {
    // Очистка кнопок выбора от предыдущих запусков сцены.
    document.querySelectorAll('#pickMale, #pickFemale').forEach((el) => el.remove());
    // Анимации для превью спрайтов (в SceneMain они создаются позже — exists-страховки там).
    if (!this.anims.exists('sprPlayer')) {
      this.anims.create({
        key: 'sprPlayer',
        frames: this.anims.generateFrameNumbers('sprPlayer'),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists('sprPlayerFemale')) {
      this.anims.create({
        key: 'sprPlayerFemale',
        frames: this.anims.generateFrameNumbers('sprPlayerFemale'),
        frameRate: 6,
        repeat: -1,
      });
    }

    this.bg = this.add.image(512, 320, 'deepspace');
    this.bg.setScale(Math.max(this.game.config.width / this.bg.width, this.game.config.height / this.bg.height));
    this.bg.setAlpha(0.45);

    const title = this.add.text(this.game.config.width * 0.5, this.game.config.height * 0.16,
      'Выберите пол персонажа', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
      });
    title.setOrigin(0.5);

    const subtitle = this.add.text(this.game.config.width * 0.5, this.game.config.height * 0.16 + 52,
      'Автор — мужчина или автор — женщина. Выбор действует в первом и втором томе.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#cfd8e3',
        align: 'center',
      });
    subtitle.setOrigin(0.5);
    subtitle.setWordWrapWidth(this.game.config.width * 0.8, true);

    // Превью спрайтов: слева — писатель (sprPlayer), справа — писательница (sprPlayerFemale).
    const previewY = this.game.config.height * 0.47;
    const left = this.add.sprite(this.game.config.width * 0.32, previewY, 'sprPlayer', 0);
    left.setScale(1.4);
    if (this.anims.exists('sprPlayer')) left.play('sprPlayer');

    const right = this.add.sprite(this.game.config.width * 0.68, previewY, 'sprPlayerFemale', 0);
    right.setScale(1.4);
    if (this.anims.exists('sprPlayerFemale')) right.play('sprPlayerFemale');

    const labelMale = this.add.text(this.game.config.width * 0.32, previewY + 140, 'Писатель', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#ffffff',
    });
    labelMale.setOrigin(0.5);
    const labelFemale = this.add.text(this.game.config.width * 0.68, previewY + 140, 'Писательница', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#ffffff',
    });
    labelFemale.setOrigin(0.5);

    const makeButton = (label) => `<button type='button' style='
      background-color: rgba(12, 17, 28, 0.92);
      border: 2px solid white;
      border-radius: 5px;
      color: white;
      padding: 0.6rem 1.2rem;
      text-transform: uppercase;
      font-family: Arial, sans-serif;
      font-weight: bold;
      font-size: 18px;
      cursor: pointer;'>${label}</button>`;

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;align-items:center;justify-content:center;width:100%;';
    row.innerHTML = `
      <div id="pickMale">${makeButton('Мужской')}</div>
      <div id="pickFemale">${makeButton('Женский')}</div>`;
    const dom = this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.86, row,
      'background-color: transparent; width: 480px; height: 0;');
    dom.setOrigin(0.5, 0.5);

    const choose = (gender) => {
      Storage.setAuthorGender(gender);
      this.scene.start('SceneMain', { chapter: 1 });
    };

    row.querySelector('#pickMale').onclick = () => choose('male');
    row.querySelector('#pickFemale').onclick = () => choose('female');
  }
}
