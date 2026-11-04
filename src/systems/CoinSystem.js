import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

export default class CoinSystem {
  constructor(scene, onCollect) {
    this.scene = scene;
    this.onCollect = onCollect;

    this.coins = [];

    this.speed = GAME_SETTINGS.obstacleSpeed;

    this.coinSize = 80;
    this.coinSpacing = 80;

    this.spawnTimer = 0;
    this.nextSpawn = this.randomSpawnDelay();

    this.createAnimation();
  }

  randomSpawnDelay() {
    return Phaser.Math.Between(4000, 5000) / 1000;
  }

  // =================================
  // 01. COIN ANIMATION
  // =================================

  createAnimation() {
    if (this.scene.anims.exists("coin-spin")) {
      return;
    }

    const frames = [];

    for (let i = 1; i <= 5; i++) {
      const frame = String(i).padStart(2, "0");

      frames.push({
        key: `coin-${frame}`
      });
    }

    this.scene.anims.create({
      key: "coin-spin",
      frames,
      frameRate: 10,
      repeat: -1
    });
  }

  // =================================
  // 02. CHECK OBSTACLE OVERLAP
  // =================================

  canSpawnAt(x, y) {
    const coinBounds = new Phaser.Geom.Rectangle(
      x - this.coinSize / 2,
      y - this.coinSize / 2,
      this.coinSize,
      this.coinSize
    );

    const obstacles =
      this.scene.obstacleSystem?.obstacles || [];

    for (const obstacleData of obstacles) {
      const obstacle = obstacleData.sprite;

      if (!obstacle || !obstacle.active) continue;

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          coinBounds,
          obstacle.getBounds()
        )
      ) {
        return false;
      }
    }

    return true;
  }

  // =================================
  // 03. SPAWN COIN GROUP
  // Returns true if a group was spawned
  // =================================

  spawnGroup() {
    const coinCount = Phaser.Math.Between(3, 4);

    const startX = GAME_SETTINGS.width + 100;

    const topBoundary =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleTop;

    const bottomBoundary =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleBottom;

    const minY = topBoundary + this.coinSize / 2;
    const maxY = bottomBoundary - this.coinSize / 2;

    let spawnY = null;

    for (let attempt = 0; attempt < 30; attempt++) {
      const candidateY = Phaser.Math.Between(minY, maxY);

      let valid = true;

      for (let i = 0; i < coinCount; i++) {
        const coinX = startX + i * this.coinSpacing;

        if (!this.canSpawnAt(coinX, candidateY)) {
          valid = false;
          break;
        }
      }

      if (valid) {
        spawnY = candidateY;
        break;
      }
    }

    if (spawnY === null) {
      return false;
    }

    for (let i = 0; i < coinCount; i++) {
      const coin = this.scene.add.sprite(
        startX + i * this.coinSpacing,
        spawnY,
        "coin-01"
      );

      coin.setDisplaySize(this.coinSize, this.coinSize);
      coin.setDepth(8);
      coin.play("coin-spin");

      this.coins.push(coin);
    }

    return true;
  }

  // =================================
  // 04. FOOT-ONLY PLAYER COLLISION
  // =================================

  checkCollection(coin) {
    const hitboxes = this.scene.drimo.getHitboxes();

    if (!hitboxes || !hitboxes.foot) {
      return false;
    }

    return Phaser.Geom.Intersects.RectangleToRectangle(
      hitboxes.foot,
      coin.getBounds()
    );
  }

  // =================================
  // 05. UPDATE COINS
  // =================================

  update(deltaSeconds) {
    // Spawn timer scales with difficulty, same as obstacles
    const speedMultiplier = this.scene.speedMultiplier || 1;
    this.spawnTimer += deltaSeconds * speedMultiplier;

    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0;

      if (this.spawnGroup()) {
        this.nextSpawn = this.randomSpawnDelay();
      } else {
        // No clear spot: retry soon instead of waiting a full cycle
        this.nextSpawn = GAME_SETTINGS.spawnRetryDelay;
      }
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];

      if (!coin.active) {
        this.coins.splice(i, 1);
        continue;
      }

      coin.x -= this.speed * deltaSeconds;

      if (this.checkCollection(coin)) {
        coin.destroy();
        this.coins.splice(i, 1);

        this.onCollect();
        continue;
      }

      if (coin.x + this.coinSize / 2 < 0) {
        coin.destroy();
        this.coins.splice(i, 1);
      }
    }
  }

  // =================================
  // 06. CLEAR COINS
  // =================================

  clear() {
    for (const coin of this.coins) {
      coin.destroy();
    }

    this.coins = [];
  }
}