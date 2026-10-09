/* eslint-disable no-undef */

import 'phaser';

const stories = [
  {
    title: 'Начинающий автор',
    entries: [
      'Он работает грузчиком, чтобы привыкнуть носить груз гениальности.',
      'Он запутался в своих чувствах и решил выплеснуть их на бумагу.',
      'Главный принцип — не рассказывать, а показывать.',
      'Страх белого листа — постоянный спутник его ночей.',
    ],
  },
  {
    title: 'Первые читатели',
    entries: [
      'Первый рассказ он перечитал десять раз. На одиннадцатый нашёл опечатку и решил, что это знак судьбы.',
      'Друг спросил, о чём книга. Автор ответил: «Пока не знаю, но герой уже куда-то идёт».',
      'Он отправил рукопись в журнал и целый день проверял почту. Письмо пришло — от курьера.',
    ],
  },
  {
    title: 'Большая история',
    entries: [
      'На обложке будущей книги уже было название. Оставалось написать саму книгу.',
      'Критик сказал: «Такое я и сам мог бы написать». Автор обрадовался: значит, получилось понятно.',
      'Он дописал последнюю страницу и открыл новый файл. У хороших историй всегда есть продолжение.',
    ],
  },
];

export default class SceneStories extends Phaser.Scene {
  constructor() {
    super({ key: 'SceneStories' });
  }

  create(data) {
    const round = data && data.round >= 1 && data.round <= stories.length ? data.round : 1;
    const story = stories[round - 1];

    const { domContainer } = this.game;
    if (domContainer) {
      while (domContainer.firstChild) domContainer.removeChild(domContainer.firstChild);
    }
    this.events.once('shutdown', () => {
      document.querySelectorAll('#story-screen').forEach((el) => el.remove());
    });

    const background = this.add.image(512, 320, 'deepspace');
    background.setScale(Math.max(
      this.game.config.width / background.width,
      this.game.config.height / background.height,
    ));
    background.setAlpha(0.55);

    const screen = document.createElement('div');
    screen.id = 'story-screen';
    screen.innerHTML = `
      <section style="
        width: min(760px, 88vw);
        max-height: 82vh;
        overflow-y: auto;
        box-sizing: border-box;
        padding: 30px 38px;
        border: 2px solid rgba(255,255,255,0.8);
        border-radius: 12px;
        background: rgba(12,17,28,0.9);
        color: #fff;
        text-align: center;
        font-family: Arial, sans-serif;
        box-shadow: 0 12px 28px rgba(0,0,0,0.45);">
        <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.8;margin-bottom:10px;">
          Сборник рассказов о начинающем авторе · часть ${round} из ${stories.length}
        </div>
        <h1 style="font-size:30px;line-height:1.2;margin:0 0 22px;">${story.title}</h1>
        <div style="font-size:18px;line-height:1.55;text-align:left;">
          ${story.entries.map((entry) => `<p style="margin:0 0 14px;">${entry}</p>`).join('')}
        </div>
        <button id="skip-stories" type="button" style="
          margin-top:14px;
          background:rgba(12,17,28,0.95);
          border:2px solid white;
          border-radius:5px;
          color:white;
          padding:0.65rem 1.8rem;
          text-transform:uppercase;
          font-family:Arial,sans-serif;
          font-weight:bold;
          font-size:16px;
          cursor:pointer;">Пропустить</button>
      </section>`;

    this.add.dom(this.game.config.width * 0.5, this.game.config.height * 0.5, screen,
      'background-color: transparent; width: 780px; max-width: 90vw;');

    screen.querySelector('#skip-stories').onclick = () => {
      this.scene.start('SceneMain', { chapter: round });
    };
  }
}
