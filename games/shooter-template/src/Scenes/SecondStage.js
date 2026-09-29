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
let score = Storage.getCurrentScore();
let scoreText;
let timerText;
let stageText;
let ammoText;
const zero = 0;
let sec = 0;

export default class SecondStage extends Phaser.Scene {
  constructor() {
    super({
      key: 'SecondStage',
    });
  }

  preload() {}

  create() {
    this.bg = this.add.image(512, 320, 'deepspace-2');
    this.bg.setScale(Math.max(this.game.config.width / this.bg.width, this.game.config.height / this.bg.height));

    stageText = this.add.text(250, 16, 'Глава 2', {
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
      frameRate: 10,
      repeat: -1,
    });

    this.player = new Player(
          this,
          this.game.config.width * 0.5,
          this.game.config.height * 0.5,
          'sprPlayer',
        );

        this.touchControls = new TouchControls(this);

    this.keyW = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP]);
    this.keyS = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN]);
    this.keyA = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT]);
    this.keyD = this.input.keyboard.addKey([Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT]);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // стрельба также по клику мыши (ЛКМ или ПКМ) — фиксируем момент нажатия
    this.mouseFireDown = false;
    this.mouseFireAt = 0;
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown() || p.leftButtonDown()) {
        this.mouseFireDown = true;
        this.mouseFireAt = this.time.now;
      }
    });
    this.input.on('pointerup', (p) => {
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
        const enemy = new GunShip(this, x, y, dir);
        enemy.setScale(Phaser.Math.Between(10, 12) * 0.1);
        this.enemies.add(enemy);
      },
      callbackScope: this,
      loop: true,
    });

    this.physics.add.collider(this.playerLasers, this.enemies, (playerLaser, enemy) => {
      if (enemy) {
        if (enemy.onDestroy !== undefined) {
          enemy.onDestroy();
        }
        enemy.explode(true);
        playerLaser.destroy();
        score += 1;
        Storage.currentScore(score);
      }
    });

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!player.getData('isDead')
        && !enemy.getData('isDead')) {
        player.explode(false);
        player.onDestroy();
        enemy.explode(true);
        stopTimer();
      }
    });

    this.physics.add.overlap(this.player, this.enemyLasers, (player, laser) => {
      if (!player.getData('isDead')
        && !laser.getData('isDead')) {
        player.explode(false);
        player.onDestroy();
        laser.destroy();
        stopTimer();
      }
    });

    const thirdStage = () => this.scene.start('ThirdStage');

    sec = 60;
    // Add timer
    const timer = setInterval(() => {
      timerText.setText(`Время: ${sec}`);
      sec--;
      if (sec < 0) {
        thirdStage();
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
    const currentAmmo = Storage.currentAmmo();

        scoreText.setText(`Читатели: ${score}`);
        ammoText.setText(`Слова: ${currentAmmo}`);

    if (currentAmmo < zero) {
      this.player.onDestroy();
      clearInterval(timer);
    }

    if (!this.player.getData('isDead')) {
          this.player.update();
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

          const firing = this.keySpace.isDown || this.touchControls.isFiring()
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
