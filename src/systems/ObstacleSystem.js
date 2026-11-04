import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

export default class ObstacleSystem {
  constructor(scene, collisionSystem, onCollision) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.onCollision = onCollision;

    this.obstacles = [];

    this.speed = GAME_SETTINGS.obstacleSpeed;

    this.width = GAME_SETTINGS.obstacleWidth;
    this.height = GAME_SETTINGS.obstacleHeight;

    this.spawnTimer = 0;
    this.nextSpawn = this.randomSpawnDelay();
  }

  randomSpawnDelay() {
    return (
      Phaser.Math.Between(
        GAME_SETTINGS.obstacleSpawnMin,
        GAME_SETTINGS.obstacleSpawnMax
      ) / 1000
    );
  }

  // =================================
  // 01. CHECK COIN OVERLAP
  // =================================

  canSpawnAt(y) {
    const obstacleBounds = new Phaser.Geom.Rectangle(
      GAME_SETTINGS.width + 100 - this.width / 2,
      y - this.height,
      this.width,
      this.height
    );

    const coins = this.scene.coinSystem?.coins || [];

    for (const coin of coins) {
      if (!coin || !coin.active) continue;

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          obstacleBounds,
          coin.getBounds()
        )
      ) {
        return false;
      }
    }

    return true;
  }

  // =================================
  // 02. SPAWN OBSTACLE
  // Returns true if an obstacle was spawned
  // =================================

  spawn() {
    const topBoundary =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleTop;

    const bottomBoundary =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleBottom;

    let spawnY = null;

    // Find a position that does not overlap coins
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidateY = Phaser.Math.Between(
        topBoundary + this.height,
        bottomBoundary
      );

      if (this.canSpawnAt(candidateY)) {
        spawnY = candidateY;
        break;
      }
    }

    if (spawnY === null) {
      return false;
    }

    const obstacle = this.scene.add.image(
      GAME_SETTINGS.width + 100,
      spawnY,
      "obstacle-01"
    );

    obstacle.setOrigin(0.5, 1);
    obstacle.setDisplaySize(this.width, this.height);
    obstacle.setDepth(8);

    const hitboxGraphics = this.scene.add.graphics();
    hitboxGraphics.setDepth(9);

    this.obstacles.push({
      sprite: obstacle,
      hitboxGraphics,
      hasCollided: false
    });

    return true;
  }

  // =================================
  // 03. COLLISION BOUNDS
  // Same rectangle the collision check uses
  // =================================

  getCollisionBounds(obstacle) {
    return this.collisionSystem.getObstacleBounds(obstacle);
  }

  // =================================
  // 04. DRAW COLLISION BOX
  // =================================

  drawCollisionBox(obstacleData) {
    const graphics = obstacleData.hitboxGraphics;

    graphics.clear();

    if (!GAME_SETTINGS.showHitboxes) return;

    const bounds = this.getCollisionBounds(obstacleData.sprite);

    graphics.lineStyle(3, 0xcc00ff, 1);

    graphics.strokeRect(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );
  }

  // =================================
  // 05. UPDATE OBSTACLES
  // =================================

  update(deltaSeconds) {
    // Spawn timer runs faster as the game speeds up, so
    // obstacle density keeps up with the difficulty.
    const speedMultiplier = this.scene.speedMultiplier || 1;
    this.spawnTimer += deltaSeconds * speedMultiplier;

    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0;

      if (this.spawn()) {
        this.nextSpawn = this.randomSpawnDelay();
      } else {
        // No clear spot: retry soon instead of waiting a full cycle
        this.nextSpawn = GAME_SETTINGS.spawnRetryDelay;
      }
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacleData = this.obstacles[i];
      const obstacle = obstacleData.sprite;

      if (!obstacle.active) {
        obstacleData.hitboxGraphics.destroy();
        this.obstacles.splice(i, 1);
        continue;
      }

      obstacle.x -= this.speed * deltaSeconds;

      this.drawCollisionBox(obstacleData);

      // ONLY FOOT COLLISION CAUSES DAMAGE
      if (!obstacleData.hasCollided) {
        if (
          this.collisionSystem.checkPotholeCollision(
            this.scene.drimo,
            obstacle
          )
        ) {
          obstacleData.hasCollided = true;

          this.onCollision();

          // Death clears this.obstacles and destroys sprites,
          // so stop iterating immediately.
          if (this.scene.gameOver) return;
        }
      }

      // REMOVE OFF-SCREEN OBSTACLES
      if (obstacle.x + this.width / 2 < 0) {
        obstacle.destroy();
        obstacleData.hitboxGraphics.destroy();

        this.obstacles.splice(i, 1);
      }
    }
  }

  // =================================
  // 06. CLEAR OBSTACLES
  // =================================

  clear() {
    for (const obstacleData of this.obstacles) {
      obstacleData.sprite.destroy();
      obstacleData.hitboxGraphics.destroy();
    }

    this.obstacles = [];
  }
}