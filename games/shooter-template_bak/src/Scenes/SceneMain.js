/* eslint-disable block-scoped-var */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
/* eslint-disable no-use-before-define */

import 'phaser';
import {
  Player,
  PlayerLaser,
  ChaserShip,
  GunShip,
  CarrierShip,
} from '../entities';

const Storage = require('../modules/storage');
const TouchControls = require('../modules/touchControls').default;

let timer;
let score = 0;
let scoreText;
let highText;
let timerText;
let stageText;
let ammoText;
let hpText;
const zero = 0;
let sec = 0;
const ammunition = 100;

const highestScore = Storage.getHighScore();

if (highestScore === null) {
  Storage.highScore(zero);
}

export default class SceneMain extends Phaser.Scene {
  constructor() {
    super({
      key: 'SceneMain',
    });
  }

  preload() {
    this.load.image('deepspace', 'assets/Background-1.png');

    this.load.spritesheet('sprExplosion', 'assets/sprExplosion.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('sprEnemy0', 'assets/sprEnemy0.png', {
      frameWidth: 96,
      frameHeight: 160,
    });
    this.load.image('sprEnemy1', 'assets/sprEnemy1.png');
    this.load.spritesheet('sprEnemy2', 'assets/sprEnemy2.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image('sprLaserEnemy0', 'assets/sprLaserEnemy0.png');
    this.load.image('sprLaserPlayer', 'assets/sprLaserPlayer.png');
    this.load.image('sprWord', 'assets/sprWord.png');
    this.load.image('sprMat', 'assets/sprMat.png');
    this.load.spritesheet('sprPlayer', 'assets/sprPlayer.png', {
      frameWidth: 89,
      frameHeight: 160,
    });

    this.load.audio('sndExplode0', 'assets/sndExplode0.wav');
    this.load.audio('sndExplode1', 'assets/sndExplode1.wav');
    this.load.audio('sndLaser', 'assets/sndLaser.wav');
  }

  create() {
    Storage.currentScore(zero);
    Storage.setAmmo(ammunition);

    this.bg = this.add.image(512, 320, 'deepspace');

    stageText = this.add.text(250, 16, 'Глава 1', {
          fontSize: '32px',
          fill: '#fff',
        });

        highText = this.add.text(16, 60, ' ', {
          fontSize: '16px',
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
      key: 'sprEnemy2',
      frames: this.anims.generateFrameNumbers('sprEnemy2'),
      frameRate: 20,
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

    this.sfx = {
      explosions: [
        this.sound.add('sndExplode0', {
          volume: 0.01,
        }),
        this.sound.add('sndExplode1', {
          volume: 0.01,
        }),
      ],
      laser: this.sound.add('sndLaser', {
        volume: 0.01,
      }),
    };

    this.player = new Player(
          this,
          this.game.config.width * 0.5,
          this.game.config.height * 0.5,
          'sprPlayer',
        );

        this.touchControls = new TouchControls(this);

    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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
        const enemy = new GunShip(this, x, y, dir);
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
        if (score > parseInt(highestScore, 10)) {
          Storage.highScore(score);
        }
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
      const phrase = 'Мои слова на исходе...';
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

    const nextScene = () => this.scene.start('SceneScores');
    const secondStage = () => this.scene.start('SecondStage');

    sec = 60;
    // Add timer
    timer = setInterval(() => {
      timerText.setText(`Время: ${sec}`);
      sec--;
      if (sec < 0) {
        secondStage();
        stopTimer();
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
    const lasthigh = Storage.getHighScore();
    const currentAmmo = Storage.currentAmmo();

    highText.setText(`Рекорд: ${lasthigh}`);
        scoreText.setText(`Читатели: ${score}`);
        ammoText.setText(`Слова: ${currentAmmo}`);
        hpText.setText(`Жизни: ${this.player.getData('hp')}/${this.player.getData('maxHp')}`);

    if (currentAmmo < zero) {
      this.player.onDestroy();
      clearInterval(timer);
    }

    if (!this.player.getData('isDead') && !this.player.getData('dying')) {
          this.player.update();
          // тач-джойстик имеет приоритет над клавиатурой
          const touchMove = this.touchControls.getMove();
          if (touchMove.x !== 0 || touchMove.y !== 0) {
            this.player.move(touchMove.x, touchMove.y);
          } else {
            if (this.keyW.isDown) {
              this.player.moveUp();
            } else if (this.keyS.isDown) {
              this.player.moveDown();
            }
            if (this.keyA.isDown) {
              this.player.moveLeft();
            } else if (this.keyD.isDown) {
              this.player.moveRight();
            }
          }

          const firing = this.keySpace.isDown || this.touchControls.isFiring();
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
