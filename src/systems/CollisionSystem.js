import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

export default class CollisionSystem {
  constructor() {
    this.damageHitbox = "foot";
  }

  // Single source of truth for the obstacle hitbox.
  // ObstacleSystem uses this same rectangle for debug drawing.
  //
  // footprint = fraction of the obstacle (measured from the
  // bottom) that can hurt. 1 = the whole image, so tall objects
  // only hurt at their base instead of at their top.
  getObstacleBounds(obstacle, footprint = 1) {
    const bounds = obstacle.getBounds();
    const scale = GAME_SETTINGS.obstacleHitboxScale;

    const width = bounds.width * scale;
    const height = bounds.height * scale;

    const left = bounds.centerX - width / 2;
    const bottom = bounds.centerY + height / 2;

    const hurtHeight = height * footprint;

    return new Phaser.Geom.Rectangle(
      left,
      bottom - hurtHeight,
      width,
      hurtHeight
    );
  }

  // obstacleData = the entry stored in ObstacleSystem
  // ({ footprint, clearance, ... })
  checkObstacleCollision(drimo, obstacle, obstacleData) {
    // JUMPING HIGH ENOUGH CLEARS THE OBSTACLE
    if (drimo.getJumpOffset() >= obstacleData.clearance) {
      return false;
    }

    const hitboxes = drimo.getHitboxes();

    // ONLY THE FOOT HITBOX CAUSES DAMAGE
    return Phaser.Geom.Intersects.RectangleToRectangle(
      hitboxes.foot,
      this.getObstacleBounds(obstacle, obstacleData.footprint)
    );
  }

  checkHeadCollision(drimo, obstacle) {
    const hitboxes = drimo.getHitboxes();

    return Phaser.Geom.Intersects.RectangleToRectangle(
      hitboxes.head,
      obstacle.getBounds()
    );
  }

  checkBodyCollision(drimo, obstacle) {
    const hitboxes = drimo.getHitboxes();

    return Phaser.Geom.Intersects.RectangleToRectangle(
      hitboxes.body,
      obstacle.getBounds()
    );
  }
}