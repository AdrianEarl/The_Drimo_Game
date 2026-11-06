import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

// Obstacle variants. They all use the same image, with different
// size, tint and movement. minTime = seconds survived before the
// type can appear.
const OBSTACLE_TYPES = [
  {
    id: "normal",
    weight: 5,
    scale: 1,
    tint: null,
    minTime: 0
  },
  {
    id: "big",
    weight: 2,
    scale: 1.35,
    tint: 0xff9e9e,
    minTime: 10
  },
  {
    id: "small",
    weight: 2,
    scale: 0.7,
    tint: 0x9ed0ff,
    minTime: 0
  },
  {
    // Wobbles up and down around its spawn lane
    id: "wobble",
    weight: 2,
    scale: 1,
    tint: 0xd09eff,
    minTime: 20,
    wobbleAmp: 45,
    wobbleFreq: 2.2
  },
  {
    // Slides up and down the whole road, bouncing off the edges
    id: "mover",
    weight: 1.5,
    scale: 1,
    tint: 0xffd27a,
    minTime: 40,
    vy: 110
  }
];

export default class ObstacleSystem {
  constructor(scene, collisionSystem, onCollision) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.onCollision = onCollision;

    this.obstacles = [];

    this.speed = GAME_SETTINGS.obstacleSpeed;

    this.width = GAME_SETTINGS.obstacleWidth;
    this.height = GAME_SETTINGS.obstacleHeight;

    this.roadTop =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleTop;

    this.roadBottom =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleBottom;

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
  // 00. PICK OBSTACLE TYPE
  // =================================

  pickType() {
    const elapsed = this.scene.elapsedTime || 0;

    const pool = OBSTACLE_TYPES.filter(
      type => elapsed >= type.minTime
    );

    const total = pool.reduce(
      (sum, type) => sum + type.weight,
      0
    );

    let roll = Phaser.Math.FloatBetween(0, total);

    for (const type of pool) {
      roll -= type.weight;

      if (roll <= 0) {
        return type;
      }
    }

    return pool[0];
  }

  // =================================
  // 01. CHECK COIN OVERLAP
  // =================================

  canSpawnAt(y, width, height, amplitude) {
    // Covers the full vertical sweep of wobbling obstacles
    const obstacleBounds = new Phaser.Geom.Rectangle(
      GAME_SETTINGS.width + 100 - width / 2,
      y - height - amplitude,
      width,
      height + amplitude * 2
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
    const type = this.pickType();

    const width = this.width * type.scale;
    const height = this.height * type.scale;
    const amplitude = type.wobbleAmp || 0;

    // Origin is bottom-center, so y is the bottom edge
    const minY = this.roadTop + height + amplitude;
    const maxY = this.roadBottom - amplitude;

    if (maxY < minY) {
      return false;
    }

    let spawnY = null;

    // Find a position that does not overlap coins
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidateY = Phaser.Math.Between(minY, maxY);

      if (this.canSpawnAt(candidateY, width, height, amplitude)) {
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
    obstacle.setDisplaySize(width, height);
    obstacle.setDepth(8);

    if (type.tint !== undefined && type.tint !== null) {
      obstacle.setTint(type.tint);
    }

    const hitboxGraphics = this.scene.add.graphics();
    hitboxGraphics.setDepth(9);

    this.obstacles.push({
      sprite: obstacle,
      hitboxGraphics,
      hasCollided: false,
      type: type.id,
      width,
      height,
      baseY: spawnY,
      amplitude,
      frequency: type.wobbleFreq || 0,
      phase: Math.random() * Math.PI * 2,
      age: 0,
      vy: type.vy
        ? (Math.random() < 0.5 ? -1 : 1) * type.vy
        : 0
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
    const dying = !!this.scene.dying;

    // Spawn timer runs faster as the game speeds up, so
    // obstacle density keeps up with the difficulty.
    // Milestone "obstacle rush" boosts it further.
    if (!dying) {
      const speedMultiplier = this.scene.speedMultiplier || 1;
      const spawnBoost = this.scene.obstacleSpawnBoost || 1;

      this.spawnTimer +=
        deltaSeconds * speedMultiplier * spawnBoost;

      if (this.spawnTimer >= this.nextSpawn) {
        this.spawnTimer = 0;

        if (this.spawn()) {
          this.nextSpawn = this.randomSpawnDelay();
        } else {
          // No clear spot: retry soon instead of waiting a full cycle
          this.nextSpawn = GAME_SETTINGS.spawnRetryDelay;
        }
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

      obstacleData.age += deltaSeconds;

      obstacle.x -= this.speed * deltaSeconds;

      // WOBBLE: oscillate around the spawn lane
      if (obstacleData.amplitude > 0) {
        obstacle.y =
          obstacleData.baseY +
          Math.sin(
            obstacleData.age * obstacleData.frequency +
            obstacleData.phase
          ) * obstacleData.amplitude;
      }

      // MOVER: slide up/down the road and bounce off the edges
      if (obstacleData.vy !== 0) {
        const minY = this.roadTop + obstacleData.height;
        const maxY = this.roadBottom;

        obstacle.y += obstacleData.vy * deltaSeconds;

        if (obstacle.y <= minY) {
          obstacle.y = minY;
          obstacleData.vy = Math.abs(obstacleData.vy);
        } else if (obstacle.y >= maxY) {
          obstacle.y = maxY;
          obstacleData.vy = -Math.abs(obstacleData.vy);
        }
      }

      this.drawCollisionBox(obstacleData);

      // ONLY FOOT COLLISION CAUSES DAMAGE
      if (!dying && !obstacleData.hasCollided) {
        if (
          this.collisionSystem.checkPotholeCollision(
            this.scene.drimo,
            obstacle
          )
        ) {
          obstacleData.hasCollided = true;

          this.onCollision();

          // The game over sequence clears this.obstacles and
          // destroys sprites, so stop iterating immediately.
          if (this.scene.gameOver) return;
        }
      }

      // REMOVE OFF-SCREEN OBSTACLES
      if (obstacle.x + obstacleData.width / 2 < 0) {
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