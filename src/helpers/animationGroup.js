/**
 * A passive animation for an animation group
 * @typedef {{}} AnimationGroup~Animation
 * @property {function} getState Returns the current animation state
 * @property {function} isFinished Returns true if the animation has stopped and doesn't need a frame to update
 * @property {function} setTarget Sets the new animation target. Animation may start again when this method is called.
 */

/**
 * Allows to have multiple animations with a single callback call on every animation frame
 *
 * @param {Record<string, AnimationGroup~Animation>} animations The groups animations. The keys are the animation ids.
 * @param {function} onUpdate A function to call when an animation state changes. Use it to apply the animations
 *  state to a target.
 */
export function makeAnimationGroup(animations, onUpdate) {
  let animationFrameId = null;

  /**
   * Sets the animations targets. The motion happens after calling this.
   *
   * @param {Record<string, *>} targets The keys are the animation ids. May contain not all the animations.
   */
  const setTargets = targets => {
    for (const [key, target] of Object.entries(targets)) {
      if (key in animations) {
        animations[key].setTarget(target);

        if (!animations[key].isFinished()) {
          updateOnNextFrame();
        }
      }
    }
  };

  /**
   * Returns the current animations states
   *
   * @returns {Record<string, *>} The keys are the animation ids
   */
  const getState = () => {
    const state = {};

    for (const [key, animation] of Object.entries(animations)) {
      state[key] = animation.getState();
    }

    return state;
  };

  /**
   * Cancels the animations
   */
  const destroy = () => {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
    }
  };

  /**
   * Calls the update callback on the next browser animation frame
   */
  const updateOnNextFrame = () => {
    if (animationFrameId === null) {
      animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    }
  };

  const handleAnimationFrame = () => {
    animationFrameId = null;

    const areAllFinished = Object.values(animations).every(animation => animation.isFinished());
    if (!areAllFinished) {
      updateOnNextFrame();
    }

    onUpdate();
  };

  return {setTargets, getState, destroy, updateOnNextFrame};
}

function quadInOut(t) {
  return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}

/**
 * @returns AnimationGroup~Animation
 * @todo Make a real transition
 */
export function makeTestTransition(initialValue, {
  duration = 500,
  easing = quadInOut
} = {}) {
  let startValue = initialValue;
  let startTime = Date.now();
  let targetValue = initialValue;
  let finished = true;

  const getState = () => {
    const stage = Math.min(1, (Date.now() - startTime) / duration);

    if (stage >= 1) {
      finished = true;
    }

    return startValue + (targetValue - startValue) * easing(stage);
  };

  const isFinished = () => finished;

  const setTarget = (value, instant) => {
    if (value === targetValue) {
      return;
    }

    startValue = instant ? value : getState();
    startTime = Date.now();
    targetValue = value;
    finished = false;
  };

  return {getState, isFinished, setTarget};
}

/**
 * @returns AnimationGroup~Animation
 */
export function makeInstantWhenHiddenTransition(valueTransition, opacityTransition) {
  return {
    getState() {
      return [valueTransition.getState(), opacityTransition.getState()];
    },
    isFinished() {
      return valueTransition.isFinished() && opacityTransition.isFinished();
    },
    setTarget([value, opacity], instant) {
      if (value !== undefined) {
        valueTransition.setTarget(value, instant || opacityTransition.getState() <= 0);
      }
      opacityTransition.setTarget(opacity, instant);
    }
  };
}
