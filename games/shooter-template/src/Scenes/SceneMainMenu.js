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

  // Список играбельных персонажей. Порядок = порядок кнопок выбора в меню.
  static get CHARACTERS() {
    return [
      { id: 'male', key: 'sprPlayer', label: 'Автор', hint: 'Он пишет колко и уверенно.' },
      { id: 'female', key: 'sprAuthorFemale', label: 'Авторша', hint: 'Она пишет остро и красиво.' },
    ];
  }

  create() {
    this.bg = this.add.image(512, 320, 'cover');
    this.bg.setDisplaySize(this.game.config.width, this.game.config.height);

    const finish = Storage.isGameFinished();
    const playLabel = finish ? 'Переписать историю' : 'Влипнуть в историю';

    // ---- Выбор персонажа -------------------------------------------------
    this.selected = Storage.getCharacter(); // 'male' | 'female'
    this.portraits = [];                    // живые спрайты-превью (анимированная ходьба)

    const title = this.add.text(this.game.config.width * 0.5, 66, 'Выбери автора', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setDepth(5);

    // Анимации создаём прямо здесь: в меню заходим ПЕРВЫМ (из index.js),
    // а в Phaser anims.create() с уже существующим ключом бросает исключение
    // и ронял бы всю сцену. Проверка exists делает код пригодным и для
    // возврата в меню после игры (SceneMain эти же анимации создаёт сам).
    SceneMainMenu.CHARACTERS.forEach((c) => {
      if (this.anims.exists(c.key)) return;
      if (!this.textures.exists(c.key)) return; // спрайта нет — не падаем
      this.anims.create({
        key: c.key,
        frames: this.anims.generateFrameNumbers(c.key),
        frameRate: 6,
        repeat: -1,
      });
    });

    SceneMainMenu.CHARACTERS.forEach((c, i) => {
      // превью стояло бы ровно по центру — смещаем пару портретов в стороны
      const x = this.game.config.width * (i === 0 ? 0.32 : 0.68);
      const y = 196;
      const spr = this.add.sprite(x, y, c.key);
      spr.setDepth(6);
      if (this.anims.exists(c.key)) spr.play(c.key);
      else spr.setFrame(0);

      const name = this.add.text(x, y + 104, c.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
      });
      name.setOrigin(0.5).setDepth(6);

      const hint = this.add.text(x, y + 130, c.hint, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#e8eef7',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 240 },
      });
      hint.setOrigin(0.5).setDepth(6);

      // рамка-подсветка выбранного персонажа (прямоугольник вокруг портрета)
      const frame = this.add.rectangle(x, y, 128, 210, 0x000000, 0.001)
        .setStrokeStyle(3, 0xffffff)
        .setDepth(5);

      const entry = { id: c.id, spr, name, hint, frame };
      this.portraits.push(entry);

      // клик по портрету (по всей области рамки) — выбрать персонажа
      const zone = this.add.zone(x, y, 150, 240).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.pickCharacter(c.id));
    });

    // подпись-подсказка под портретами
    this.charNote = this.add.text(this.game.config.width * 0.5, 352, ' ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#ffd966',
      stroke: '#000000',
      strokeThickness: 5,
    });
    this.charNote.setOrigin(0.5).setDepth(6);

    this.refreshCharacters();

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
    const hintBtn = document.getElementById('hint');
    const overlay = this.modal.querySelector('#hintOverlay');
    const closeBtn = this.modal.querySelector('#hintClose');

    playBtn.onclick = () => {
      // в игру уходим сразу с выбранным персонажем (глава 1)
      this.scene.start('SceneMain', { character: this.selected, chapter: 1 });
    };
    hintBtn.onclick = () => { this.modal.style.display = 'block'; };
    closeBtn.onclick = () => { this.modal.style.display = 'none'; };
    overlay.onclick = (e) => { if (e.target === overlay) this.modal.style.display = 'none'; };

    // стрелки влево/вправо тоже выбирают персонажа (без мыши и с телефона удобно)
    this.input.keyboard.on('keydown-LEFT', () => this.pickCharacter('male'));
    this.input.keyboard.on('keydown-RIGHT', () => this.pickCharacter('female'));
  }

  // Меню открывают снова после «В меню» из экрана итогов. Старые DOM-кнопки
  // к тому моменту уже удалены вместе со сценой, а модальное окно живёт в
  // document.body — убираем его, иначе оно осталось бы поверх новой сцены.
  shutdown() {
    if (this.modal && this.modal.parentNode) this.modal.parentNode.removeChild(this.modal);
    this.modal = null;
  }

  // Пересоздавать DOM-кнопки не нужно — меняем только вид портретов.
  refreshCharacters() {
    this.portraits.forEach((p) => {
      const on = p.id === this.selected;
      p.frame.setStrokeStyle(on ? 4 : 2, on ? 0xffd966 : 0xffffff, on ? 1 : 0.35);
      p.frame.setAlpha(1);
      p.spr.setAlpha(on ? 1 : 0.55);
      p.name.setAlpha(on ? 1 : 0.6);
      p.hint.setAlpha(on ? 1 : 0.5);
      p.spr.setScale(on ? 1.12 : 1);
    });
    const cur = SceneMainMenu.CHARACTERS.find((c) => c.id === this.selected);
    if (this.charNote && cur) this.charNote.setText(`Играешь за: ${cur.label}`);
  }

  pickCharacter(id) {
    if (this.selected === id) return;
    this.selected = Storage.setCharacter(id);
    this.refreshCharacters();
  }
}
