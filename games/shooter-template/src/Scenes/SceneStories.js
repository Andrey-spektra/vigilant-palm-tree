/* eslint-disable no-undef */

import 'phaser';

const stories = [
  {
    title: 'Кто он, начинающий писатель:',
    intro: '<strong>Вы будете играть за автора книг.</strong><br><br>Чтобы лучше ощутить героя, прочитайте несколько коротких рассказов, создающих атмосферу.',
    entries: [
      'Работает он пока грузчиком, чтобы привыкнуть носить груз гениальности.',
      'Он запутался в своих чувствах и решил выплеснуть их на бумагу.',
      'Оказалось, просто отравился горошком.',
      'Мечтает, чтобы поклонницы разорвали на нём одежду, как на поп-звезде,<br>но пока есть только дырки на трениках.',
      'Сначала помощников у него нет, он делает всё сам:<br>пишет, корректирует, рыдает над текстом.',
      '<strong>Но он уже «В одном ряду».</strong>',
      '— Вы говорите, что уже в одном ряду с Гоголем, Толстым, Набоковым. Почему вы так считаете?',
      '— Видите ли, в чём дело. Многие числовые ряды начинаются с нуля.',
      '<strong>Потому что поборол «Страх белого листа».</strong>',
      'Он проснулся с криком и в холодном, как сердце красавицы, поту.',
      '— Опять тебе снился белый лист?',
      '— Да, каждую ночь этот белый кошмар.',
      '— Успокойся, в сотый раз тебе говорю: мы не пускаем деньги на ветер, мы экономные, мы покупаем только жёлтую бумагу.',
      '<strong>И он уже «Вкусно пишет».</strong>',
      '— Я пишу очень вкусно, мне все так говорят. Думаешь, я великий автор?',
      '— Нет, ты помощник кондитера, иди подписывать торты.',
    ],
  },
  {
    title: 'Кто тот автор, который уже освоился в ремесле:',
    entries: [
      '<strong>Заложники</strong>',
      '— Что у нас тут?<br>— Капитан, писатель захватил людей и не отпускает!<br>— Не подходите ко мне, я сатирик.<br>— Всем отойти, он может ранить словом.<br>— Послушай, парень, отпусти их, мы все тут твои друзья!<br>— А почему тогда блоги мои не читаете и комменты не пишете?<br>— Смотри, я прямо сейчас добавил твой рассказ в библиотеку и начал читать.<br>— Он ещё и капитана захватил! Уходим все срочно, он набирает популярность.',
      '<strong>Грязный рассказ</strong>',
      'Он решает быть современным, едким, дерзким: добавляет в книгу грязи.<br>За него бьются издатели, потому что книги разлетаются.<br>Пенсионеры сметают книги с полок — грязь оказалась лечебной.',
      '<strong>Сила слова</strong>',
      '— Автор просто вывернул меня наизнанку своим творчеством.<br>— Так, я не поняла — понравилось или стошнило?',
      '<strong>Авторский голос</strong>',
      '— Почему вы начали орать на прохожих?<br>— Искал авторский голос.<br>— Нашли голос?<br>— Пока нет, но получил первое признание.<br>— Это первый ваш травмирующий опыт в писательстве?<br>— Нет.<br>— А что было?<br>— Узнал, что автор должен быть перед читателем гол.',
    ],
  },
  {
    title: 'Ещё более опытному автору соответствует вот эта атмосфера:',
    entries: [
      '<strong>Главный принцип</strong>',
      '— Что для вас главное как для писателя?<br>— Главный принцип — это не рассказывать, а показывать.<br>— Это, конечно, хорошо, но, может, всё-таки прикроетесь?',
      '<strong>Цепкие рассказы</strong>',
      '— Нужно сказать, что ваши книги умеют найти дорогу к читателю, зацепить и не отпускать после прочтения.<br>— Да, это так.<br>— А когда вам пришла в голову идея печатать рассказы на Волках?',
      '<strong>Таков закон</strong>',
      '— Вы следите за другими популярными авторами?<br>— Нет.<br>— Неинтересно или завидуете?<br>— Судебный запрет.',
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
        display: flex;
        flex-direction: column;
        width: min(760px, 88vw);
        height: min(82vh, 520px);
        max-height: 82vh;
        overflow: hidden;
        box-sizing: border-box;
        padding: 30px 38px;
        border: 2px solid rgba(255,255,255,0.8);
        border-radius: 12px;
        background: rgba(12,17,28,0.9);
        color: #fff;
        text-align: center;
        font-family: Arial, sans-serif;
        box-shadow: 0 12px 28px rgba(0,0,0,0.45);">
        <div style="
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          overflow-anchor: none;
          touch-action: none;">
          <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.8;margin-bottom:10px;">
            Сборник рассказов о начинающем авторе · часть ${round} из ${stories.length}
          </div>
          <h1 style="font-size:30px;line-height:1.2;margin:0 0 22px;">${story.title}</h1>
          ${story.intro ? `<p style="font-size:18px;line-height:1.55;margin:0 0 22px;">${story.intro}</p>` : ''}
          <div style="font-size:18px;line-height:1.55;text-align:left;">
            ${story.entries.map((entry) => `<p style="margin:0 0 14px;">${entry}</p>`).join('')}
          </div>
        </div>
        <button id="skip-stories" type="button" style="
          flex: 0 0 auto;
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
      'background-color: transparent; width: 780px; max-width: 90vw; height: min(82vh, 520px);');

    const storyContent = screen.querySelector('#story-screen > section > div');
    storyContent.addEventListener('wheel', (event) => {
      event.preventDefault();
      event.stopPropagation();
      storyContent.scrollTop += event.deltaY;
    }, { passive: false });

    let activePointerId = null;
    let touchStartY = 0;
    let touchStartScrollTop = 0;
    storyContent.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;

      event.preventDefault();
      event.stopPropagation();
      activePointerId = event.pointerId;
      touchStartY = event.clientY;
      touchStartScrollTop = storyContent.scrollTop;
      storyContent.setPointerCapture(event.pointerId);
    }, { passive: false });
    storyContent.addEventListener('pointermove', (event) => {
      if (event.pointerId !== activePointerId) return;

      event.preventDefault();
      event.stopPropagation();
      storyContent.scrollTop = touchStartScrollTop + touchStartY - event.clientY;
    }, { passive: false });
    const stopTouchScroll = (event) => {
      if (event.pointerId === activePointerId) {
        event.preventDefault();
        event.stopPropagation();
        activePointerId = null;
      }
    };
    storyContent.addEventListener('pointerup', stopTouchScroll, { passive: false });
    storyContent.addEventListener('pointercancel', stopTouchScroll, { passive: false });

    screen.querySelector('#skip-stories').onclick = () => {
      this.scene.start('SceneMain', { chapter: round });
    };
  }
}
