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
    // Полная очистка DOM-контейнера Phaser и модалок предыдущих сцен.
    // Кнопки в игре — это DOM-элементы (this.add.dom), которые Phaser НЕ
    // удаляет при переключении сцен; раньше они оставались «висящими» поверх
    // меню (кнопка «В меню», кнопки выбора персонажа). На главном экране
    // других DOM-элементов быть не должно — вычищаем ВСЁ содержимое
    // контейнера game.domContainer, а не только известные id.
    const domContainer = this.game.domContainer;
    if (domContainer) {
      while (domContainer.firstChild) domContainer.removeChild(domContainer.firstChild);
    }
    // Страховка: элементы могли попасть напрямую в body/parent канваса.
    document.querySelectorAll('#button, #play, #gender, #hint, #pickMale, #pickFemale')
      .forEach((el) => el.remove());
    document.querySelectorAll('.game-dom-modal').forEach((el) => el.remove());

    const clearMenuElements = () => {
      document.querySelectorAll('#button, #play, #gender, #hint, #pickMale, #pickFemale')
        .forEach((el) => el.remove());
      document.querySelectorAll('.game-dom-modal').forEach((el) => el.remove());
    };
    this.events.once('shutdown', clearMenuElements);

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

    // Кнопка «Выбор героя» — перед игрой можно сменить пол персонажа (автор — мужчина/женщина).
    const gender = document.createElement('div');
    gender.innerHTML = `<button type='button' id='gender'
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
    Выбор героя</button>`;
    this.gender = this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.60, gender, 'background-color: transparent; width: 200px; height: 0;');

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
    this.modal.className = 'game-dom-modal';
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
            На телефоне — джойстик слева, пламенная речь справа.
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
    const genderBtn = document.getElementById('gender');
    const hintBtn = document.getElementById('hint');
    const overlay = this.modal.querySelector('#hintOverlay');
    const closeBtn = this.modal.querySelector('#hintClose');

    playBtn.onclick = () => {
      // Если пол ещё не выбран — сначала сцена выбора персонажа.
      clearMenuElements();
      if (!Storage.getAuthorGender()) {
        this.scene.start('SceneGender');
      } else {
        this.scene.start('SceneStories', { round: 1 });
      }
    };
    genderBtn.onclick = () => {
      clearMenuElements();
      this.scene.start('SceneGender');
    };
    hintBtn.onclick = () => { this.modal.style.display = 'block'; };
    closeBtn.onclick = () => { this.modal.style.display = 'none'; };
    overlay.onclick = (e) => { if (e.target === overlay) this.modal.style.display = 'none'; };
  }
}
