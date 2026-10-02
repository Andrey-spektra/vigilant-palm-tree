/* eslint-disable block-scoped-var */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
/* eslint-disable no-use-before-define */

import 'phaser';
import {
  Player,
  GunShip,
} from '../entities';

const Storage = require('../modules/storage');
const TouchControls = require('../modules/touchControls').default;

let timer;
let score = 0;
let scoreText;
let ammoText;
let hpText;
let timerText;
let stageText;
const zero = 0;
let sec = 0;
// Слова бесконечны в обеих главах.
const ammunition = Infinity;
// Текущая глава: 1 — Писатель, 2 — Поклонница (стреляет «Ещё»).
let chapter = 1;

export default class SceneMain extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneMain',
    });
  }

  preload() {}

  create(data) {
    chapter = (data && data.chapter) || 1;
    if (chapter === 1) score = 0; // новый запуск; глава 2 продолжает счёт
    Storage.currentScore(score);
    Storage.setAmmo(ammunition);

    this.bg = this.add.image(512, 320, 'deepspace');
    this.bg.setScale(Math.max(this.game.config.width / this.bg.width, this.game.config.height / this.bg.height));

    stageText = this.add.text(250, 16,
      chapter === 1 ? 'Глава 1 — бесконечные слова' : 'Глава 2 — поклонница говорит «Ещё»', {
        fontSize: '32px',
        fill: '#fff',
      });

    scoreText = this.add.text(16, 16, ' ', {
          fontSize: '32px',
          fill: '#fff',
        });

        timerText = this.add.text(350, 60, ' ', {
          fontSize: '16px',
          fill: '#fff',
        });

        ammoText = this.add.text(330, 90, ' ', {
          fontSize: '16px',
          fill: '#fff',
        });

        hpText = this.add.text(16, 110, ' ', {
                  fontSize: '18px',
                  fill: '#fff',
                });

    this.anims.create({
      key: 'sprEnemy0',
      frames: this.anims.generateFrameNumbers('sprEnemy0'),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'sprExplosion',
      frames: this.anims.generateFrameNumbers('sprExplosion'),
      frameRate: 20,
      repeat: 0,
    });
    this.anims.create({
      key: 'sprPlayer',
      frames: this.anims.generateFrameNumbers('sprPlayer'),
      frameRate: 6,
      repeat: -1,
    });
    // Анимация Авторши (женский персонаж, выбор в меню) — кадры 0..4 того же плана.
    if (!this.anims.exists('sprAuthorFemale')) {
      this.anims.create({
        key: 'sprAuthorFemale',
        frames: this.anims.generateFrameNumbers('sprAuthorFemale'),
        frameRate: 6,
        repeat: -1,
      });
    }
    // Анимация поклонницы (глава 2) — те же кадры 0..4, что и у спрайт-листа.
    if (!this.anims.exists('sprFan')) {
      this.anims.create({
        key: 'sprFan',
        frames: this.anims.generateFrameNumbers('sprFan'),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Персонаж выбирается в главном меню (SceneMainMenu): 'male' | 'female'.
    // Глава 2 приходит с character === 'fan' — это сюжетная поклонница, её
    // выбор не запоминаем, чтобы после «Переписать историю» играл выбранный Автор.
    const character = (data && data.character) || Storage.getCharacter();
    if (Storage.isPlayableCharacter(character)) Storage.setCharacter(character);
    this.character = character;

    this.player = new Player(
          this,
          this.game.config.width * 0.5,
          this.game.config.height * 0.5,
          Storage.characterKey(character),
          { fanWords: !!(data && data.fanWords) },
        );

        this.touchControls = new TouchControls(this);

    this.keyW = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP]);
    this.keyS = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN]);
    this.keyA = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT]);
    this.keyD = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT]);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Резервный клавиатурный обработчик: если плагин Phaser Keyboard по какой-то
    // причине не получит события (фокус окна, особенности офлайн-файла),
    // дублируем состояния тех же клавиш через нативные слушатели.
    // Булевы флаги вместо счётчиков нажатий: keyup гарантированно сбрасывает
    // состояние (счётчик мог «залипнуть», если браузер не доставил keyup).
    if (!window.__GAME_KEY_FALLBACK__) {
      window.__GAME_KEY_FALLBACK__ = true;
      const map = {
        KeyW: 'w', ArrowUp: 'w', KeyS: 's', ArrowDown: 's',
        KeyA: 'a', ArrowLeft: 'a', KeyD: 'd', ArrowRight: 'd', Space: 'space',
      };
      const st = window.__GAME_KEYS__ = window.__GAME_KEYS__ || { w: false, s: false, a: false, d: false, space: false };
      const resetKeys = () => { st.w = st.s = st.a = st.d = st.space = false; };
      // capture-фаза: сработаем раньше любого stopPropagation внутри Phaser
      window.addEventListener('keydown', (e) => {
        const k = map[e.code];
        if (k) st[k] = true;
      }, true);
      window.addEventListener('keyup', (e) => {
        const k = map[e.code];
        if (k) st[k] = false;
      }, true);
      window.addEventListener('blur', resetKeys);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) resetKeys();
      });
    }
    // стрельба также по клику мыши (ЛКМ или ПКМ) — фиксируем момент нажатия.
    // ВАЖНО: только для мыши! На телефоне касание джойстика давало pointerdown
    // с leftButtonDown() === true и игрок стрелял словами при любом движении.
    // Огонь на тач-устройствах — ТОЛЬКО по кнопке «ОГОНЬ» (touchControls.isFiring()).
    this.mouseFireDown = false;
    this.mouseFireAt = 0;
    const isTouchDevice = !!window.__TOUCH_MODE__
      || !!(this.sys.game.device
        && this.sys.game.device.input
        && (this.sys.game.device.input.multiTouch
          || this.sys.game.device.input.touch));
    this.input.on('pointerdown', (p) => {
      if (isTouchDevice) return;
      if (p.rightButtonDown() || p.leftButtonDown()) {
        this.mouseFireDown = true;
        this.mouseFireAt = this.time.now;
      }
    });
    this.input.on('pointerup', (p) => {
      if (isTouchDevice) {
        this.mouseFireDown = false;
        return;
      }
      if (!p.rightButtonDown() && !p.leftButtonDown()) this.mouseFireDown = false;
    });
    // правая кнопка мыши не должна вызывать контекстное меню
    if (this.input.mouse && this.input.mouse.disableContextMenu) {
      this.input.mouse.disableContextMenu();
    }

    this.enemies = this.add.group();
    this.enemyLasers = this.add.group();
    this.playerLasers = this.add.group();

    this.time.addEvent({
      delay: 2500,
      callback() {
        // гопник появляется у левого или правого края и идёт вбок
        const fromLeft = Phaser.Math.Between(0, 1) === 0;
        const dir = fromLeft ? 1 : -1;
        const x = fromLeft ? 0 : this.game.config.width;
        const y = Phaser.Math.Between(120, this.game.config.height - 120);
        const enemy = new GunShip(this, x, y, dir, chapter);
        enemy.setScale(Phaser.Math.Between(10, 12) * 0.1);
        this.enemies.add(enemy);
      },
      callbackScope: this,
      loop: true,
    });

    this.physics.add.collider(this.playerLasers, this.enemies, (playerLaser, enemy) => {
      if (enemy) {
        if (enemy.die !== undefined) {
          enemy.die(); // замирает, фраза, затем исчезает
        } else if (enemy.onDestroy !== undefined) {
          enemy.onDestroy();
          enemy.explode(true);
        }
        playerLaser.destroy();
        score += 1;
        Storage.currentScore(score);
      }
    });

    const gopnikHitPhrases = ['Какой примитив!', 'Это меня задело!', 'Я глубоко оскорблен!'];
    let gopnikHitIdx = 0;
    const showGopnikHitPhrase = () => {
      const phrase = gopnikHitPhrases[gopnikHitIdx % gopnikHitPhrases.length];
      gopnikHitIdx += 1;
      // приоритет: реплика попадания убирает реплику стрельбы, чтобы не наслаивались
      if (this.authorShootSpeech) {
        this.authorShootSpeech.destroy();
        this.authorShootSpeech = null;
      }
      const text = this.add.text(
        this.player.x,
        this.player.y - 70,
        phrase,
        {
          fontFamily: 'monospace',
          fontSize: '19px',
          fill: '#9fd8ff',
          stroke: '#000000',
          strokeThickness: 6,
          backgroundColor: 'rgba(0,0,0,0.65)',
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
          wordWrap: { width: 260 },
          align: 'center',
        },
      );
      text.setOrigin(0.5);
      text.setDepth(30);
      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 3000,
        delay: 250,
        onComplete: () => text.destroy(),
      });
    };

    const damagePlayer = () => {
      if (!this.player.getData('isDead') && !this.player.getData('dying')) {
        const alive = this.player.takeDamage();
        if (alive) {
          showGopnikHitPhrase();
        } else {
          killPlayer();
        }
      }
    };

    const killPlayer = () => {
      if (this.player.getData('dying') || this.player.getData('isDead')) return;
      this.player.setData('dying', true);
      stopTimer();
      // замирает на одном кадре
      this.player.body.setVelocity(0, 0);
      this.player.anims.stop();
      // произносит последнюю фразу
      const phrase = chapter === 2 ? 'Не-е-ет, я хотела ещё!' : 'Мои слова на исходе...';
      const text = this.add.text(
        this.player.x,
        this.player.y - 90,
        phrase,
        {
          fontFamily: 'monospace',
          fontSize: '19px',
          fill: '#9fd8ff',
          stroke: '#000000',
          strokeThickness: 6,
          backgroundColor: 'rgba(0,0,0,0.65)',
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
          wordWrap: { width: 260 },
          align: 'center',
        },
      );
      text.setOrigin(0.5);
      text.setDepth(30);
      // затем исчезает
      this.time.delayedCall(1100, () => {
        if (this.player && this.player.active) {
          this.player.explode(false); // устанавливает isDead и запускает исчезновение
          this.player.onDestroy();
        }
      });
    };

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!player.getData('isDead')
        && !enemy.getData('isDead')) {
        damagePlayer();
        enemy.explode(true);
        enemy.onDestroy();
      }
    });

    this.physics.add.overlap(this.player, this.enemyLasers, (player, laser) => {
      if (!player.getData('isDead')
        && !laser.getData('isDead')) {
        damagePlayer();
        laser.destroy();
      }
    });

    // Переход между главами: 1 -> 2 (поклонница), 2 -> экран итогов.
    const nextScene = () => {
      if (chapter === 1) {
        // Глава 2: враги — поклонницы, а игроком остаётся ВЫБРАННЫЙ в меню
        // Автор (мужчина или женщина). Отличия только в бое: он стреляет
        // словом «Ещё» (ключ fanWords), как это делала поклонница.
        this.scene.start('SceneMain', { chapter: 2, character: this.character, fanWords: true });
      } else {
        this.scene.start('SceneScores', { chapter: 2 });
      }
    };

    sec = 60;
    // Add timer
    timer = setInterval(() => {
      timerText.setText(`Время: ${sec}`);
      sec--;
      if (sec < 0) {
        stopTimer();
        nextScene();
      }
    }, 1000);

    function stopTimer() {
      clearInterval(timer);
    }
  }

  getEnemiesByType(type) {
    const arr = [];
    for (let i = 0; i < this.enemies.getChildren().length; i++) {
      const enemy = this.enemies.getChildren()[i];
      if (enemy.getData('type') === type) {
        arr.push(enemy);
      }
    }
    return arr;
  }


  update() {
    // Слова бесконечны — проверка боезапасa больше не нужна.
    scoreText.setText(`Читатели: ${score}`);
        ammoText.setText('Слова: ∞');
        hpText.setText(`Жизни: ${this.player.getData('hp')}/${this.player.getData('maxHp')}`);

    if (!this.player.getData('isDead') && !this.player.getData('dying')) {
          this.player.update();
          // тач-джойстик имеет приоритет над клавиатурой
          const touchMove = this.touchControls.getMove();
          const gk = window.__GAME_KEYS__ || { w: false, s: false, a: false, d: false, space: false };
          if (touchMove.x !== 0 || touchMove.y !== 0) {
            this.player.move(touchMove.x, touchMove.y);
          } else {
            if (this.keyW.isDown || gk.w) {
              this.player.moveUp();
            } else if (this.keyS.isDown || gk.s) {
              this.player.moveDown();
            }
            if (this.keyA.isDown || gk.a) {
              this.player.moveLeft();
            } else if (this.keyD.isDown || gk.d) {
              this.player.moveRight();
            }
          }

          const firing = this.keySpace.isDown || gk.space || this.touchControls.isFiring()
            || this.mouseFireDown
            || (this.mouseFireAt && this.time.now - this.mouseFireAt < 200);
          if (firing) {
            this.player.setData('isShooting', true);
          } else {
            this.player.setData('timerShootTick', this.player.getData('timerShootDelay') - 1);
            this.player.setData('isShooting', false);
                      }
                    }

    for (let i = 0; i < this.enemies.getChildren().length; i++) {
      const enemy = this.enemies.getChildren()[i];

      enemy.update();

      if (enemy.x < -enemy.displayWidth
        || enemy.x > this.game.config.width + enemy.displayWidth
        || enemy.y < -enemy.displayHeight * 4
        || enemy.y > this.game.config.height + enemy.displayHeight) {
        if (enemy) {
          if (enemy.onDestroy !== undefined) {
            enemy.onDestroy();
          }
          enemy.destroy();
        }
      }
    }

    for (let i = 0; i < this.enemyLasers.getChildren().length; i++) {
      const laser = this.enemyLasers.getChildren()[i];
      laser.update();
      if (laser.x < -laser.displayWidth
        || laser.x > this.game.config.width + laser.displayWidth
        || laser.y < -laser.displayHeight * 4
        || laser.y > this.game.config.height + laser.displayHeight) {
        if (laser) {
          laser.destroy();
        }
      }
    }

    for (let i = 0; i < this.playerLasers.getChildren().length; i++) {
      const laser = this.playerLasers.getChildren()[i];
      laser.update();
      if (laser.x < -laser.displayWidth
        || laser.x > this.game.config.width + laser.displayWidth
        || laser.y < -laser.displayHeight * 4
        || laser.y > this.game.config.height + laser.displayHeight) {
        if (laser) {
          laser.destroy();
        }
      }
    }
  }
}
// temp
