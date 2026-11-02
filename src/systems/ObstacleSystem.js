
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

    this.nextSpawn =
      Phaser.Math.Between(
        GAME_SETTINGS.obstacleSpawnMin,
        GAME_SETTINGS.obstacleSpawnMax
      ) / 1000;
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

      const coinBounds = coin.getBounds();

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          obstacleBounds,
          coinBounds
        )
      ) {
        return false;
      }
    }

    return true;
  }

  // =================================
  // 02. SPAWN OBSTACLE
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

    // Skip spawning if no clear position is available
    if (spawnY === null) {
      return;
    }

    const obstacle = this.scene.add.image(
      GAME_SETTINGS.width + 100,
      spawnY,
      "obstacle-01"
    );

    obstacle.setOrigin(0.5, 1);

    obstacle.setDisplaySize(
      this.width,
      this.height
    );

    obstacle.setDepth(8);

    const hitboxGraphics = this.scene.add.graphics();
    hitboxGraphics.setDepth(9);

    this.obstacles.push({
      sprite: obstacle,
      hitboxGraphics,
      hasCollided: false
    });
  }

  // =================================
  // 03. COLLISION BOUNDS
  // =================================

  getCollisionBounds(obstacle) {
    const bounds = obstacle.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.x + bounds.width * 0.15,
      bounds.y + bounds.height * 0.15,
      bounds.width * 0.70,
      bounds.height * 0.70
    );
  }

  // =================================
  // 04. DRAW COLLISION BOX
  // =================================

  drawCollisionBox(obstacleData) {
    const obstacle = obstacleData.sprite;
    const graphics = obstacleData.hitboxGraphics;

    graphics.clear();

    if (!GAME_SETTINGS.showHitboxes) return;

    const bounds = this.getCollisionBounds(obstacle);

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
    this.spawnTimer += deltaSeconds;

    if (this.spawnTimer >= this.nextSpawn) {
      this.spawn();

      this.spawnTimer = 0;

      this.nextSpawn =
        Phaser.Math.Between(
          GAME_SETTINGS.obstacleSpawnMin,
          GAME_SETTINGS.obstacleSpawnMax
        ) / 1000;
    }

    for (
      let i = this.obstacles.length - 1;
      i >= 0;
      i--
    ) {
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
