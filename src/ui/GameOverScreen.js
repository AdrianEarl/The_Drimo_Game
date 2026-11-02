
export default class GameOverScreen {
  constructor(scene) {
    this.scene = scene;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(200);
    this.container.setVisible(false);

    const background = scene.add.rectangle(
      960,
      540,
      1920,
      1080,
      0x000000,
      0.75
    );

    const title = scene.add.text(
      960,
      420,
      "GAME OVER",
      {
        fontFamily: "Arial",
        fontSize: "90px",
        color: "#ff4545",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.finalScore = scene.add.text(
      960,
      540,
      "",
      {
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#ffffff"
      }
    ).setOrigin(0.5);

    const restartMessage = scene.add.text(
      960,
      640,
      "PRESS R TO RESTART",
      {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#ffd447"
      }
    ).setOrigin(0.5);

    this.container.add([
      background,
      title,
      this.finalScore,
      restartMessage
    ]);
  }

  show(score) {
    this.finalScore.setText(
      `FINAL SCORE: ${score}`
    );

    this.container.setVisible(true);
  }
}
