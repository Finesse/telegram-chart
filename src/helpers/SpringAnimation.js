export default class SpringAnimation {
  value;

  onChange;

  targetValue;

  animationFrameId = null;

  constructor({initialValue, onChange}) {
    this.value = initialValue;
    this.targetValue = initialValue;
    this.onChange = onChange;
  }

  goTo(value) {
    if (this.value === undefined) {
      this.value = value;
      this.targetValue = initialValue;
      return;
    }

    if (value === this.targetValue) {
      return;
    }

    this.targetValue = value;
    this.updateOnNextFrame();
  }

  destroy() {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  updateOnNextFrame() {
    if (this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.update();
    });
  }

  update() {
    this.value = this.value + (this.targetValue - this.value) * 0.3;

    if (Math.abs(this.targetValue - this.value) < 0.01) {
      this.value = this.targetValue;
    } else {
      this.updateOnNextFrame();
    }

    this.onChange(this.value);
  }
}
