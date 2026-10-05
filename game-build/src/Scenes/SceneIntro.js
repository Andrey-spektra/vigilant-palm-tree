/* eslint-disable no-undef */

import 'phaser';

const Storage = require('../modules/storage');

export default class SceneIntro extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneIntro',
    });
  }

  create() {
    this.bg = this.add.image(512, 320, 'deepspace');
    const div = document.createElement('div');
    div.innerHTML = `<p
    style=" color: white;
    font-size: 15px;
    text-align:justify;
    width: 420px;
    line-height: 1.25rem;
    font-weight: bold;
    margin: 15px 0 0px 0;"
    />
    Приветствую, писатель!
    <br/>
    Сегодня ты вступаешь в битву за читателей.
    <br/>
    Твое оружие слово, оно влияет на людей и меняет их в лучшую сторону.
    <br/>
    Сыпь остротами, бей каламбурами, доноси мудрость.
    <br/>
    <br/>
    Удачи тебе в этой эпичной битве!
    <br/>
    <br/>
    Твой друг и разработчик этой игры,
    <br/>
    Андрей Шитиков
    <br/>
    <br/>
    Для движения жми: [W] [A] [S] [D] — Сказать свое веское слово – жми: [ПРОБЕЛ]. На телефоне — джойстик слева, пламенная речь справа.
    </p>

    <button type='submit' id='button'
    style='background-color: transparent;
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0 7rem;
    margin-left: 3.5rem;
    text-transform: uppercase;
    font-weight: bold;'>
    Влипнуть в историю</button>`;
    this.add.dom(this.game.config.width * 0.3, this.game.config.height * 0, div, 'background-color: transparent; width: 220px; height: 0; font: 48px Arial');

    const btn = document.getElementById('button');
    btn.onclick = () => {
      // Тоже через выбор пола, если он ещё не сделан.
      if (!Storage.getAuthorGender()) this.scene.start('SceneGender');
      else this.scene.start('SceneMain');
    };
  }
}
