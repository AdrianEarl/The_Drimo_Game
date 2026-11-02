
import Phaser from "phaser";

export default class CollisionSystem {
  constructor() {
    this.damageHitbox = "foot";
  }

  checkPotholeCollision(drimo, obstacle) {
    const hitboxes = drimo.getHitboxes();

    const footBounds = hitboxes.foot;

    const obstacleBounds = obstacle.getBounds();

    // REDUCE OBSTACLE HITBOX TO 90%
    obstacleBounds.x += obstacleBounds.width * 0.05;
    obstacleBounds.width *= 0.90;

    obstacleBounds.y += obstacleBounds.height * 0.05;
    obstacleBounds.height *= 0.90;

    // ONLY THE FOOT HITBOX CAUSES DAMAGE
    return Phaser.Geom.Intersects.RectangleToRectangle(
      footBounds,
      obstacleBounds
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
