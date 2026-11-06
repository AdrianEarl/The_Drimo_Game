import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

export default class CollisionSystem {
  constructor() {
    this.damageHitbox = "foot";
  }

  // Single source of truth for the obstacle hitbox.
  // ObstacleSystem uses this same rectangle for debug drawing.
  getObstacleBounds(obstacle) {
    const bounds = obstacle.getBounds();
    const scale = GAME_SETTINGS.obstacleHitboxScale;

    const width = bounds.width * scale;
    const height = bounds.height * scale;

    return new Phaser.Geom.Rectangle(
      bounds.centerX - width / 2,
      bounds.centerY - height / 2,
      width,
      height
    );
  }

  checkPotholeCollision(drimo, obstacle) {
    // JUMPING OVER A POTHOLE (or DASHING THROUGH IT) IS SAFE
    if (drimo.isInvulnerable()) {
      return false;
    }

    const hitboxes = drimo.getHitboxes();

    // ONLY THE FOOT HITBOX CAUSES DAMAGE
    return Phaser.Geom.Intersects.RectangleToRectangle(
      hitboxes.foot,
      this.getObstacleBounds(obstacle)
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