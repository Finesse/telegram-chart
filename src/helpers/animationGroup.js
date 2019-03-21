/**
 * A passive animation for an animation group
 * @typedef {{}} AnimationGroup~Animation
 * @property {function} getState Returns the current animation state
 * @property {function} isFinished Returns true if the animation has stopped and doesn't need a frame to update
 * @property {function} setTarget Sets the new animation target. Animation may start again when this method is called.
 */

/**
 * @callback AnimationGroup~animationFactory
 * @returns AnimationGroup~Animation
 */

/**
 * Allows to have multiple animations with a single callback call on every animation frame
 */
export default class AnimationGroup {
  /**
   * The animations of the group
   * @type {Record<string, AnimationGroup~Animation>}
   */
  animations = {};

  /**
   * A function to call on an animation frame
   * @type {function}
   */
  onUpdate;

  /**
   * The current browser animation frame request id
   * @type {number|null}
   */
  animationFrameId = null;

  /**
   * @param {Record<string, AnimationGroup~animationFactory>} animations The groups animations. The keys are the
   *  animation ids.
   * @param {function} onUpdate A function to call when an animation state changes. Use it to apply the animations
   *  state to a target.
   */
  constructor(animations, onUpdate) {
    this.onUpdate = onUpdate;
    this.setAnimations(animations);
  }

  /**
   * Sets the new list of animations
   *
   * @param {Record<string, AnimationGroup~animationFactory>} animations The groups animations. The keys are the
   *  animation ids.
   */
  setAnimations(animations) {
    // Remove missing animations
    for (const key of Object.keys(this.animations)) {
      if (!(key in animations)) {
        delete this.animations[key];
      }
    }

    // Add new animations
    for (const [key, factory] of Object.entries(animations)) {
      if (!(key in this.animations)) {
        this.animations[key] = factory();
      }
    }
  }

  /**
   * Sets the animations targets. The motion happens after calling this.
   *
   * @param {Record<string, *>} targets The keys are the animation ids. May contain not all the animations.
   */
  setTargets(targets) {
    for (const [key, target] of Object.entries(targets)) {
      if (key in this.animations) {
        this.animations[key].setTarget(target);

        if (!this.animations[key].isFinished()) {
          this.updateOnNextFrame();
        }
      }
    }
  }

  /**
   * Returns the current animations states
   *
   * @returns {Record<string, *>} The keys are the animation ids
   */
  getState() {
    const state = {};

    for (const [key, animation] of Object.entries(this.animations)) {
      state[key] = animation.getState();
    }

    return state;
  }

  /**
   * Cancels the animations
   */
  destroy() {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Calls the update callback on the next browser animation frame
   */
  updateOnNextFrame() {
    if (this.animationFrameId === null) {
      this.animationFrameId = window.requestAnimationFrame(this.handleAnimationFrame);
    }
  }

  /**
   * @protected
   */
  handleAnimationFrame = () => {
    this.animationFrameId = null;

    const areAllFinished = Object.values(this.animations).every(animation => animation.isFinished());
    if (!areAllFinished) {
      this.updateOnNextFrame();
    }

    this.onUpdate();
  };
}

function quadInOut(t) {
  return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}

/**
 * @implements AnimationGroup~Animation
 * @todo Make a real transition
 */
export class TestTransition {
  startValue;
  startTime;
  targetValue;

  constructor({initialValue}) {
    this.startValue = initialValue;
    this.startTime = Date.now();
    this.targetValue = initialValue;
  }

  getState() {
    // const value = this.targetValue - (this.targetValue - this.startValue) * Math.exp((this.startTime - Date.now()) / 100);
    const value = this.startValue + (this.targetValue - this.startValue) * quadInOut(Math.min(1, (Date.now() - this.startTime) / 500));

    return Math.abs(this.targetValue - value) > 0.01 ? value : this.targetValue;
  }

  isFinished() {
    return this.getState() === this.targetValue;
  }

  setTarget(value) {
    if (value === this.targetValue) {
      return;
    }

    this.startValue = this.getState();
    this.startTime = Date.now();
    this.targetValue = value;
  }
}
