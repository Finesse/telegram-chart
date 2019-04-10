import {quadInOut} from 'd3-ease/src/quad';

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
  function setTargets(targets) {
    for (const [key, target] of Object.entries(targets)) {
      if (key in animations) {
        animations[key].setTarget(target);

        if (!animations[key].isFinished()) {
          updateOnNextFrame();
        }
      }
    }
  }

  /**
   * Returns the current animations states
   *
   * @returns {Record<string, *>} The keys are the animation ids
   */
  function getState() {
    const state = {};

    for (const [key, animation] of Object.entries(animations)) {
      state[key] = animation.getState();
    }

    return state;
  }

  /**
   * Cancels the animations
   */
  function destroy() {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  /**
   * Calls the update callback on the next browser animation frame
   */
  function updateOnNextFrame() {
    if (animationFrameId === null) {
      animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    }
  }

  function handleAnimationFrame() {
    animationFrameId = null;

    const areAllFinished = Object.values(animations).every(animation => animation.isFinished());
    if (!areAllFinished) {
      updateOnNextFrame();
    }

    onUpdate();
  }

  return {setTargets, getState, destroy, updateOnNextFrame};
}

/**
 * A simple transition from one value to another
 *
 * @returns AnimationGroup~Animation
 */
export function makeTransition(initialValue, {
  duration = 400,
  easing = quadInOut,
  maxDistance = Infinity
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

    if (startValue < targetValue) {
      startValue = Math.max(startValue, targetValue - maxDistance);
    } else {
      startValue = Math.min(startValue, targetValue + maxDistance);
    }
  };

  return {getState, isFinished, setTarget};
}

/**
 * Handles two transitions: makes the first instant when the opacity is 0. Suitable for something that should move
 * instantly while invisible.
 *
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

/**
 * Animates the number power transitions. A great choice for a zoom transition.
 *
 * @returns AnimationGroup~Animation
 */
export function makeExponentialTransition(initialValue, {minPlainValue = 1e-9, ...options} = {}) {
  function plainValueToPower(value) {
    return Math.max(Math.log(value), minPlainValue);
  }

  function powerToPlainValue(power) {
    return Math.exp(power);
  }

  const powerTransition = makeTransition(plainValueToPower(initialValue), options);

  return {
    getState() {
      return powerToPlainValue(powerTransition.getState());
    },
    isFinished() {
      return powerTransition.isFinished();
    },
    setTarget(value, instant) {
      powerTransition.setTarget(plainValueToPower(value), instant);
    }
  };
}
