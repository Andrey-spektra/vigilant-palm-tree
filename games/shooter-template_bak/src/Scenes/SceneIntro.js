/* eslint-disable no-undef */

import 'phaser';

export default class SceneIntro extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneIntro',
    });
  }

  create() {
    this.bg = this.add.image(512, 320, 'deepspace-menu');
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
    Ты — Андрей Шитиков, автор, слова которого бьют точно в цель. Но на улицах города сегодня неспокойно: сборище гопников и быдла вышло на охоту за твоей рукописью.
    <br/>
    <br/>
    Не отдавай им ни строчки! Бросай в них свои самые колкие фразы — сатиру, каламбуры, абзацы и целые диалоги.
    <br/>
    <br/>
    У каждого гопника своя броня: у кого-то толстое самомнение, у кого-то пустая голова. Выбирай слова с умом и не дай им приблизиться.
    <br/>
    <br/>
    Помни: настоящего писателя не сломить. Каждое твоё слово делает тебя сильнее, а город — чище от хулиганья.
    <br/>
    <br/>
    Удачи тебе в этой словесной битве!
    <br/>
    <br/>
    Твой добрый друг,
    <br/>
    Андрей Шитиков
    <br/>
    <br/>
    Движение: [W] [A] [S] [D] — Стрельба: [ПРОБЕЛ]. На телефоне — джойстик слева, огонь справа.
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
    В бой</button>`;
    this.add.dom(this.game.config.width * 0.3, this.game.config.height * 0, div, 'background-color: transparent; width: 220px; height: 0; font: 48px Arial');

    const btn = document.getElementById('button');
    btn.onclick = () => this.scene.start('SceneMain');
  }
}
