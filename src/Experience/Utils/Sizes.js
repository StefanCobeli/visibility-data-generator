import EventEmitter from "./EventEmitter.js";
export default class Sizes extends EventEmitter {
  constructor() {
    super();
    const canvas = document.querySelector(".left-top");
    const canvasPadding = parseFloat(getComputedStyle(canvas).padding);

    // console.log(canvas.clientWidth);
    this.width = canvas.clientWidth - canvasPadding * 4;
    this.height = canvas.clientHeight;
    this.pixelRatio = 1;

    window.addEventListener("resize", () => {
      const tempCanvas = document.querySelector(".left-top");

      this.width = tempCanvas.clientWidth - canvasPadding * 4;
      this.height = tempCanvas.clientHeight;

      this.pixelRatio = Math.min(window.devicePixelRatio, 2);

      this.trigger("resize");
    });
  }
}
