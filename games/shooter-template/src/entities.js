/* eslint-disable max-classes-per-file */
/* eslint-disable no-this-before-super */
/* eslint-disable no-undef */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */

let ammunition = 100;
const Storage = require('./modules/storage');

export class Entity extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, key, type) {
    super(scene, x, y, key);
    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.world.enableBody(this, 0);
    this.setData('type', type);
    this.setData('isDead', false);
  }

  explode(canDestroy) {
    if (!this.getData('isDead')) {
      // Set the texture to the explosion image, then play the animation
      this.setTexture('sprExplosion'); // this refers to the same animation key we used when we added this.anims.create previously
      this.play('sprExplosion'); // play the animation
      if (this.shootTimer !== undefined) {
        if (this.shootTimer) {
          this.shootTimer.remove(false);
        }
      }
      this.setAngle(0);
      this.body.setVelocity(0, 0);
      this.on('animationcomplete', function x() {
        if (canDestroy) {
          this.destroy();
        } else {
          this.setVisible(false);
        }
      }, this);
      this.setData('isDead', true);
      // звук взрыва (безопасно: window.SFX не бросает исключений)
      if (window.SFX) {
        window.SFX.play(this.scene.game,
          Phaser.Math.Between(0, 1) === 0 ? 'sndExplode0' : 'sndExplode1', 0.35);
      }
    }
  }
}

export class Player extends Entity {
  constructor(scene, x, y, key) {
    super(scene, x, y, key, 'Player');
    this.setData('speed', 200);
    this.setData('isShooting', false);
    this.setData('timerShootDelay', 10);
    this.setData('timerShootTick', this.getData('timerShootDelay') - 1);
    this.setData('maxHp', 3);
    this.setData('hp', 3);
    this.setData('invulnUntil', 0);

    this.play('sprPlayer');
  }

  // возвращает true, если игрок получил урон и ещё жив; false если умер
  takeDamage() {
    if (this.getData('isDead')) return false;
    if (this.scene.time.now < this.getData('invulnUntil')) return true; // неуязвимость
    this.setData('invulnUntil', this.scene.time.now + 700); // 0.7с неуязвимости
    const hp = this.getData('hp') - 1;
    this.setData('hp', hp);
    return hp > 0;
  }

  // движение через аддитивную запись скорости: если в одном кадре вызвано
  // несколько направлений (например, резервный клавиатурный обработчик и
  // физический ключ Phaser дают «вверх» одновременно), скорость складывается
  // и затем нормализуется в update(), чтобы диагональ не была быстрее прямой.
  // Раньше использовалось прямое присваивание velocity — из-за этого два
  // вызова moveUp() в одном кадре не давали эффекта, а конфликт состояний
  // приводил к «залипанию» героя в углу экрана.
  // Присваивание (не аддитивная запись): каждый кадр update() вызывает
  // moveUp()/moveDown() только если клавиша реально нажата, поэтому «залипших»
  // вызовов нет. Аддитивная схема (_wishX/_wishY), которую я пробовал ранее,
  // ломала движение: update() обнулял body.velocity, а накопленные _wish*
  // нигде не применялись — герой стоял на месте.
  // Каждое направление ДОБАВЛЯЕТ свою составляющую, а не перезаписывает
  // всю скорость: раньше moveUp() присваивал velocity.y и молча обнулял
  // velocity.x (и наоборот) — при удержании двух клавиш герой «клинит»:
  // последнее вызванное в кадре направление перетираает первое.
  moveUp() {
    this.body.velocity.y -= this.getData('speed');
  }

  moveDown() {
    this.body.velocity.y += this.getData('speed');
  }

  moveLeft() {
    this.setFlipX(true);
    this.body.velocity.x -= this.getData('speed');
  }

  moveRight() {
    this.setFlipX(false);
    this.body.velocity.x += this.getData('speed');
  }

  // векторное движение (для тач-джойстика): dx, dy в диапазоне -1..1
  move(dx, dy) {
    const sp = this.getData('speed');
    this.body.velocity.x = dx * sp;
    this.body.velocity.y = dy * sp;
    if (dx < -0.1) this.setFlipX(true);
    else if (dx > 0.1) this.setFlipX(false);
  }

  onDestroy() {
    this.scene.time.addEvent({ // go to game over scene
      delay: 1000,
      callback() {
        this.scene.scene.start('SceneScores');
      },
      callbackScope: this,
      loop: false,
    });
  }

  onSecondStage() {
    this.scene.time.addEvent({
      delay: 1000,
      callback() {
        this.scene.scene.start('SceneSecondStage');
      },
      callbackScope: this,
      loop: false,
    });
  }

  update() {
    this.body.setVelocity(0, 0);

    // центр спрайта не должен уходить за пределы экрана дальше, чем на половину габарита,
    // иначе герой окажется обрезанным (половина роста/ширины уйдёт за край)
    const halfW = this.displayWidth / 2;
    const halfH = this.displayHeight / 2;
    this.x = Phaser.Math.Clamp(this.x, halfW, this.scene.game.config.width - halfW);
    this.y = Phaser.Math.Clamp(this.y, halfH, this.scene.game.config.height - halfH);

    // Ограничение скорости: движение из сцены вызывает moveUp()/moveLeft() и
    // т.д. ПОСЛЕ этого update(), каждое направление добавляет свою составляющую
    // (см. moveUp). Если в одном кадре направление применилось дважды (дубль
    // через резервную клавиатуру), величина может вырасти — нормализуем её
    // обратно к базовой скорости, чтобы «клининг» и разгон были невозможны.
    const sp = this.getData('speed') || 200;
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      const cap = sp * Math.SQRT2 + 1;
      if (len > cap) {
        this.body.velocity.x = (vx / len) * cap;
        this.body.velocity.y = (vy / len) * cap;
      }
    }

    if (this.getData('isShooting')) {
      if (this.getData('timerShootTick') < this.getData('timerShootDelay')) {
        this.setData('timerShootTick', this.getData('timerShootTick') + 1); // every game update, increase timerShootTick by one until we reach the value of timerShootDelay
      } else { // when the "manual timer" is triggered:
        const dir = this.flipX ? -1 : 1; // стрельба вбок — в сторону, куда смотрит игрок
        // выстрел из «головы» — выше центра, смещение по направлению
        const muzzleX = this.x + dir * 45;
        const muzzleY = this.y - 55;
        const laser = new PlayerLaser(this.scene, muzzleX, muzzleY, dir);
        this.scene.playerLasers.add(laser);

        // звук выстрела (слово) — безопасный проигрыватель
        if (window.SFX) window.SFX.play(this.scene.game, 'sndLaser', 0.18);

        // фраза при стрельбе (не чаще раза в полторы секунды)
        const now = this.scene.time.now;
        const last = this.getData('lastSpeechAt') || 0;
        if (now - last > 1500) {
          this.setData('lastSpeechAt', now);
          // убираем предыдущую реплику стрельбы, чтобы не наслаивались
          if (this.scene.authorShootSpeech) {
            this.scene.authorShootSpeech.destroy();
            this.scene.authorShootSpeech = null;
          }
          const phrases = [
            'Как тебе моя сатира?',
            'Получи каламбуром',
            'Держи абзац',
            'Немного колкостей тебе',
            'Отхлебни гениальности',
            'Искупайся в диалогах',
            'Насладись сюжетом',
            'Как тебе интрига?',
          ];
          const phrase = phrases[Phaser.Math.Between(0, phrases.length - 1)];
          const tx = this.scene.add.text(this.x, this.y - 90, phrase, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#9fd8ff',
            stroke: '#000000',
            strokeThickness: 6,
            backgroundColor: 'rgba(0,0,0,0.65)',
            padding: { left: 8, right: 8, top: 4, bottom: 4 },
            wordWrap: { width: 260 },
            align: 'center',
          });
          tx.setOrigin(0.5);
          tx.setDepth(20);
          if (window.Speech) window.Speech.say(phrase);
          this.scene.authorShootSpeech = tx;
          this.scene.tweens.add({
            targets: tx,
            y: this.y - 150,
            alpha: 0,
            duration: 1800,
            onComplete: () => {
              if (this.scene.authorShootSpeech === tx) {
                this.scene.authorShootSpeech = null;
              }
              if (tx) tx.destroy();
            },
          });
        }

        this.setData('timerShootTick', 0);
        ammunition--;
        Storage.setAmmo(ammunition);
      }
    }
  }
}

export class PlayerLaser extends Entity {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'sprWord');
    const d = dir === 0 || dir === undefined || dir === null ? 1 : dir;
    this.body.velocity.x = d * 200; // летит строго вбок — в сторону, куда смотрит игрок
    this.body.velocity.y = 0;
    this.setTint(0x9fd8ff); // цвет слова — как у реплик автора
  }
}

export class EnemyLaser extends Entity {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'sprMat');
    const d = dir === 0 || dir === undefined || dir === null ? 1 : dir;
    this.body.velocity.x = d * 200; // летит строго вбок — в сторону, куда смотрит гопник
    this.body.velocity.y = 0;
    this.setTint(0xffc766); // цвет мата — как у реплик гопника
  }
}

export class ChaserShip extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprEnemy1', 'ChaserShip');

    this.body.velocity.y = Phaser.Math.Between(50, 100);

    this.states = {
      MOVE_DOWN: 'MOVE_DOWN',
      CHASE: 'CHASE',
    };
    this.state = this.states.MOVE_DOWN;
  }

  update() {
    if (!this.getData('isDead') && this.scene.player) {
      if (Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.scene.player.x,
        this.scene.player.y,
      ) < 320) {
        this.state = this.states.CHASE;
      }

      if (this.state === this.states.CHASE) {
        const dx = this.scene.player.x - this.x;
        const dy = this.scene.player.y - this.y;

        const angle = Math.atan2(dy, dx);

        const speed = 100;
        this.body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
        );

        if (this.x < this.scene.player.x) {
          this.angle -= 5;
        } else {
          this.angle += 5;
        }
      }
    }
  }
}

export class GunShip extends Entity {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'sprEnemy0', 'GunShip');
    const d = dir === 0 || dir === undefined || dir === null ? 1 : dir;
    this.play('sprEnemy0');

    this.setFlipX(d < 0);
    this.dir = d;
    this.body.velocity.x = this.dir * Phaser.Math.Between(40, 70); // идёт вбок

    // фраза при появлении (случайная из списка)
    const phrases = [
      'Писатель? А я художник — дай рожу распишу.',
      'Чё, голодный? Давай, угощу люлями.',
      'Чё лыбу тянешь? Ща ноги протянешь.',
      'Улица, фонарь под глазом — и в аптеку.',
      'Лютого знаешь? Это я лютый.',
      'Ты не догоняешь? Так я тебя ногой догоню.',
      'Фантаст? Так ща улетишь в другие миры.',
      'Страдаешь? Ща будешь пострадавшим.',
      'Ты на голой вечеринке — отдавай всё мне.',
    ];
    const phrase = phrases[Phaser.Math.Between(0, phrases.length - 1)];
    // смещение подписи в сторону игрока, чтобы не резалась у края экрана
    this.speechOffset = this.dir * 130;
    // фраза появляется с задержкой — гопник сперва выходит с края на экран
    this.spawnTimer = this.scene.time.delayedCall(800, () => {
      if (this.getData('isDead') || !this.active) return;
      this.speech = this.scene.add.text(this.x + this.speechOffset, this.y - 95, phrase, {
        fontFamily: 'monospace',
        fontSize: '22px',
        fill: '#ffc766',
        stroke: '#000000',
        strokeThickness: 6,
        backgroundColor: 'rgba(0,0,0,0.65)',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        wordWrap: { width: 320 },
        align: 'center',
      });
      this.speech.setOrigin(0.5);
      this.speech.setDepth(20);
      if (window.Speech) window.Speech.say(phrase);
      this.scene.tweens.add({
        targets: this.speech,
        y: this.speech.y - 60,
        alpha: 0,
        duration: 2200,
        delay: 1200,
        onComplete: () => {
          if (this.speech) {
            this.speech.destroy();
            this.speech = null;
          }
        },
      });
    });

    this.shootTimer = this.scene.time.addEvent({
      delay: 1600,
      callback() {
        // выстрел из «головы» — выше центра, смещение по направлению
        const muzzleX = this.x + this.dir * 45;
        const muzzleY = this.y - 55;
        const laser = new EnemyLaser(
          this.scene,
          muzzleX,
          muzzleY,
          this.dir,
        );
        laser.setScale(this.scaleX * 0.7);
        this.scene.enemyLasers.add(laser);
      },
      callbackScope: this,
      loop: true,
    });
  }

  update() {
    // держим гопника в кадре по вертикали: он должен весь входить в экран
    const halfH = this.displayHeight / 2;
    this.y = Phaser.Math.Clamp(this.y, halfH, this.scene.game.config.height - halfH);

    // держим подпись над головой, пока жив (со смещением в сторону игрока)
    if (this.speech) {
      this.speech.setPosition(this.x + this.speechOffset, this.speech.y);
    }
  }

  // фраза, когда гопник получил урон (случайная из списка)
  showHitPhrase() {
    const phrases = [
      'Он чем-то зацепил меня, гад.',
      'Его слова ранят!',
      'Он пырнул меня чем-то по сердцу...',
      'Мне нужно это осмыслить.',
      'Это изысканно!',
      'Какой витиеватый слог!',
      'Автор, жги ещё!',
      'Хочу в библиотеку!',
      'Дай ещё почитать.',
      'Я мыслю. Я существую.',
      'Какая развязка!',
      'Подпишусь на автора!',
      'Лайк и респект автору!',
    ];
    const phrase = phrases[Phaser.Math.Between(0, phrases.length - 1)];
    // приоритет: реплика попадания убирает реплику появления, чтобы не наслаивались
    if (this.speech) {
      this.speech.destroy();
      this.speech = null;
    }
    const tx = this.scene.add.text(this.x + this.speechOffset, this.y - 95, phrase, {
      fontFamily: 'monospace',
      fontSize: '20px',
      fill: '#ffc766',
      stroke: '#000000',
      strokeThickness: 6,
      backgroundColor: 'rgba(0,0,0,0.65)',
      padding: { left: 10, right: 10, top: 5, bottom: 5 },
      wordWrap: { width: 280 },
      align: 'center',
    });
    tx.setOrigin(0.5);
    tx.setDepth(30);
    if (window.Speech) window.Speech.say(phrase);
    this.scene.tweens.add({
      targets: tx,
      y: tx.y - 60,
      alpha: 0,
      duration: 3000,
      delay: 300,
      onComplete: () => tx.destroy(),
    });
  }

  // смерть гопника: замирает на одном кадре, произносит фразу, затем исчезает
  die() {
    if (this.getData('dying')) return;
    this.setData('dying', true);
    this.body.setVelocity(0, 0); // замирает
    this.anims.stop(); // останавливаем анимацию на одном кадре
    if (this.shootTimer) {
      this.shootTimer.remove(false);
      this.shootTimer = null;
    }
    this.showHitPhrase(); // произносит фразу
    this.scene.time.delayedCall(900, () => {
      if (!this.active) return;
      this.explode(true); // устанавливает isDead и запускает анимацию исчезновения
      this.onDestroy();
    });
  }

  onDestroy() {
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
      this.spawnTimer = null;
    }
    if (this.speech) {
      this.speech.destroy();
      this.speech = null;
    }
    if (this.shootTimer !== undefined) {
      if (this.shootTimer) {
        this.shootTimer.remove(false);
      }
    }
  }
}

export class CarrierShip extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprEnemy2', 'CarrierShip');
    this.play('sprEnemy2');

    this.body.velocity.y = Phaser.Math.Between(50, 100);
  }
}

export class ScrollingBackground {
  constructor(scene, key, velocityY) {
    this.scene = scene;
    this.key = key;
    this.velocityY = velocityY;

    this.layers = this.scene.add.group();

    this.createLayers();
  }

  createLayers() {
    for (let i = 0; i < 2; i++) {
      const layer = this.scene.add.sprite(0, 0, this.key);
      layer.y = (layer.displayHeight * i);
      const flipX = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1;
      const flipY = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1;
      layer.setScale(flipX * 2, flipY * 2);
      layer.setDepth(-5 - (i - 1));
      this.scene.physics.world.enableBody(layer, 0);
      layer.body.velocity.y = this.velocityY;

      this.layers.add(layer);
    }
  }

  update() {
    if (this.layers.getChildren()[0].y > 0) {
      for (let i = 0; i < this.layers.getChildren().length; i++) {
        const layer = this.layers.getChildren()[i];
        layer.y = (-layer.displayHeight) + (layer.displayHeight * i);
      }
    }
  }
}
