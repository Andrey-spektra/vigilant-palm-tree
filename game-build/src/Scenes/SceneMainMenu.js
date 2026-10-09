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

    // Визуальное вступление: небольшая подборка эпиграфов и мемо-историй
    // поверх главного меню, чтобы игра открывалась уже как “сборник рассказов”.
    const notes = document.createElement('div');
    notes.innerHTML = `
      <div style="
        width: min(680px, 82vw);
        background: rgba(12, 17, 28, 0.7);
        border: 2px solid rgba(255,255,255,0.7);
        border-radius: 12px;
        padding: 18px 22px 16px;
        box-sizing: border-box;
        color: #fff;
        text-align: center;
        font-family: Arial, sans-serif;
        box-shadow: 0 12px 28px rgba(0,0,0,0.35);
      ">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; opacity: 0.8; margin-bottom: 10px;">Сборник рассказов о писателе</div>
        <div style="font-size: 18px; font-weight: bold; line-height: 1.35; margin-bottom: 12px;">
          С чего начать этот сборник? Конечно, с мемо-рассказов про начинающего автора.
        </div>
        <div style="font-size: 15px; line-height: 1.5; opacity: 0.95;">
          • Он работает грузчиком, чтобы привыкнуть носить груз гениальности.<br>
          • Он запутался в своих чувствах и решил выплеснуть их на бумагу.<br>
          • Главный принцип — не рассказывать, а показывать.<br>
          • Страх белого листа — постоянный спутник его ночей.
        </div>
      </div>`;
    this.notes = this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.26, notes, 'background-color: transparent; width: 680px; height: auto;');

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
        this.scene.start('SceneMain', { chapter: 1 });
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
