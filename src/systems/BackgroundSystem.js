import { GAME_SETTINGS } from "../config/gameConfig";

// The background changes every this many meters
export const BACKGROUND_CHANGE_EVERY = 1000;

const BACKGROUND_PATH = "/assets/backgrounds";

// Order of the backgrounds. After the last one it loops back
// to the first. "file" is the file name without ".png":
//   <file>.png
//   <file>-start-transition.png
//   <file>-end-transition.png
export const BACKGROUND_STAGES = [
  { id: "night", file: "night-scene" },
  { id: "searoad", file: "searoad-scene" },
  { id: "baywalk", file: "baywalk-scene" },
  { id: "nrscc", file: "nrscc-scene" }
];

// Neighbouring images overlap by 1px so no hairline gap can
// show between them while scrolling.
const OVERLAP = 1;

// When the background changes, the strip becomes:
//   [current scene] [current END transition]
//   [next START transition] [next scene ...]
export default class BackgroundSystem {
  // Called from GameScene.preload()
  static preload(scene) {
    for (const stage of BACKGROUND_STAGES) {
      scene.load.image(
        `bg-${stage.id}`,
        `${BACKGROUND_PATH}/${stage.file}.png`
      );

      scene.load.image(
        `bg-${stage.id}-start`,
        `${BACKGROUND_PATH}/${stage.file}-start-transition.png`
      );

      scene.load.image(
        `bg-${stage.id}-end`,
        `${BACKGROUND_PATH}/${stage.file}-end-transition.png`
      );
    }
  }

  constructor(scene) {
    this.scene = scene;

    // Every image currently in the strip, left to right
    this.segments = [];

    // Texture keys waiting to be added (the transitions)
    this.queue = [];

    // Which background is currently being laid out
    this.stageIndex = 0;

    // How many 1000 m steps have been reached
    this.step = 0;

    // Where the next image will be placed
    this.nextX = 0;

    this.fill();
  }

  // =================================
  // BUILDING THE STRIP
  // =================================

  appendSegment(key) {
    // Skip images that failed to load
    if (!this.scene.textures.exists(key)) {
      return false;
    }

    const image = this.scene.add.image(
      this.nextX,
      GAME_SETTINGS.height / 2,
      key
    );

    // Left-middle origin: x is the left edge of the image
    image.setOrigin(0, 0.5);

    // Every image is scaled to the full game height
    const scale = GAME_SETTINGS.height / image.height;

    image.setScale(scale);
    image.setDepth(0);

    const segment = {
      image,
      x: this.nextX,
      width: image.width * scale,
      scale
    };

    this.segments.push(segment);

    this.nextX += segment.width - OVERLAP;

    return true;
  }

  // Adds images until the right edge of the screen is covered
  fill() {
    const limit = GAME_SETTINGS.width + 10;

    let guard = 0;

    while (this.nextX < limit && guard < 50) {
      guard += 1;

      const stage = BACKGROUND_STAGES[this.stageIndex];

      const key =
        this.queue.length > 0
          ? this.queue.shift()
          : `bg-${stage.id}`;

      this.appendSegment(key);
    }
  }

  // =================================
  // CHANGING THE BACKGROUND
  // =================================

  // Call every frame while playing with the distance in meters
  setDistance(meters) {
    const step = Math.floor(meters / BACKGROUND_CHANGE_EVERY);

    if (step > this.step) {
      this.step = step;

      this.changeStage(step % BACKGROUND_STAGES.length);
    }
  }

  changeStage(nextIndex) {
    if (nextIndex === this.stageIndex) return;

    // Everything past the right edge of the screen is replaced
    // by the transition, so the change starts right away.
    const cutX = GAME_SETTINGS.width;

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];

      if (segment.x >= cutX) {
        segment.image.destroy();
        this.segments.splice(i, 1);
      } else if (segment.x + segment.width > cutX) {
        // This image crosses the edge: crop off the hidden part
        const visible = cutX - segment.x;

        segment.image.setCrop(
          0,
          0,
          visible / segment.scale,
          segment.image.height
        );

        segment.width = visible;
      }
    }

    const last = this.segments[this.segments.length - 1];

    this.nextX = last
      ? last.x + last.width - OVERLAP
      : cutX;

    const current = BACKGROUND_STAGES[this.stageIndex];
    const next = BACKGROUND_STAGES[nextIndex];

    this.queue = [
      `bg-${current.id}-end`,
      `bg-${next.id}-start`
    ];

    this.stageIndex = nextIndex;

    this.fill();
  }

  // =================================
  // UPDATE
  // =================================

  update(deltaSeconds, speed) {
    const distance = speed * deltaSeconds;

    this.nextX -= distance;

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];

      segment.x -= distance;

      // Fully off the left side of the screen
      if (segment.x + segment.width <= 0) {
        segment.image.destroy();
        this.segments.splice(i, 1);
        continue;
      }

      segment.image.x = segment.x;
    }

    this.fill();
  }
}