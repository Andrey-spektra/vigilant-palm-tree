/* eslint-disable no-undef */

import 'phaser';
import Storage from '../modules/storage';

export default class SceneMainMenu extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneMainMenu',
    });
  }

  preload() {}

  create() {
    this.bg = this.add.image(512, 320, 'cover');
    this.bg.setDisplaySize(this.game.config.width, this.game.config.height);

    const finish = Storage.isGameFinished();
    const playLabel = finish ? 'Переписать историю' : 'Влипнуть в историю';

    // Кнопка «Влипнуть в историю / Переписать историю» — системный шрифт, чтобы читалось у всех
    const play = document.createElement('div');
    play.innerHTML = `<button type='submit' id='play'
    style='background-color: rgba(12, 17, 28, 0.92);
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.6rem 1.2rem;
    margin-left: 1rem;
    text-transform: uppercase;
    font-family: Arial, sans-serif;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;'>
    ${playLabel}</button>`;
    this.play = this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.72, play, 'background-color: transparent; width: 260px; height: 0;');

    // Кнопка «Подсказка» — открывает окно с приветствием и управлением
    const hint = document.createElement('div');
    hint.innerHTML = `<button type='button' id='hint'
    style='background-color: rgba(12, 17, 28, 0.92);
    border: 2px solid white;
    border-radius: 5px;
    color: white;
    padding: 0.4rem 1rem;
    text-transform: uppercase;
    font-family: Arial, sans-serif;
    font-weight: bold;
    font-size: 15px;
    cursor: pointer;'>
    Подсказка</button>`;
    this.hint = this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.86, hint, 'background-color: transparent; width: 160px; height: 0;');

    // Программно лепим модальное окно в body, чтобы оно было поверх всего
    this.modal = document.createElement('div');
    this.modal.innerHTML = `
      <div id="hintOverlay" style="
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.72);
        display: flex; align-items: center; justify-content: center;
        font-family: Arial, sans-serif;">
        <div style="
          background: #0c111c; border: 2px solid #fff; border-radius: 10px;
          color: #fff; max-width: 520px; width: 90%; padding: 22px 26px;
          box-sizing: border-box;">
          <h2 style="margin: 0 0 14px; font-size: 22px; text-align:center;">Приветствую, писатель!</h2>
          <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.5;">
            Ты вступаешь в битву за читателей. Твоё оружие — слово.<br>
            Сыпь остротами, бей каламбурами, доноси мудрость.<br>
            Удачи в этой эпичной битве!
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">
            <b>Управление:</b><br>
            На клавиатуре — [W][A][S][D] ходьба, [ПРОБЕЛ] — слово.<br>
            На телефоне — джойстик слева, кнопка «ОГОНЬ» справа.<br>
            Режим бесконечный: слова не кончаются, глава не заканчивается —<br>
            играй, пока жив. Смерть возвращает в меню.
          </p>
          <div style="text-align:center;">
            <button id="hintClose" style="
              background:#d62b2b; border:2px solid #fff; border-radius:5px;
              color:#fff; padding:0.5rem 1.6rem; text-transform:uppercase;
              font-family:Arial,sans-serif; font-weight:bold; font-size:15px;
              cursor:pointer;">Понятно</button>
          </div>
          <p style="margin:14px 0 0; font-size:13px; text-align:center; opacity:0.75;">
            Твой друг и разработчик — Андрей Шитиков
          </p>
        </div>
      </div>`;
    this.modal.style.display = 'none';
    document.body.appendChild(this.modal);

    const playBtn = document.getElementById('play');
    const hintBtn = document.getElementById('hint');
    const overlay = this.modal.querySelector('#hintOverlay');
    const closeBtn = this.modal.querySelector('#hintClose');

    playBtn.onclick = () => this.scene.start('SceneMain');
    hintBtn.onclick = () => { this.modal.style.display = 'block'; };
    closeBtn.onclick = () => { this.modal.style.display = 'none'; };
    overlay.onclick = (e) => { if (e.target === overlay) this.modal.style.display = 'none'; };
  }
}
