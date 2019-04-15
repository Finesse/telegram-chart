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
  const animationGroup = makeTransitionGroup(animations);

  /**
   * Sets the animations targets. The motion happens after calling this.
   *
   * @param {Record<string, *>} targets The keys are the animation ids. May contain not all the animations.
   */
  function setTargets(targets) {
    animationGroup.setTarget(targets);
    if (!animationGroup.isFinished()) {
      updateOnNextFrame();
    }
  }

  /**
   * Returns the current animations states
   *
   * @returns {Record<string, *>} The keys are the animation ids
   */
  function getState() {
    return animationGroup.getState();
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

    if (!animationGroup.isFinished()) {
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
export function makeTransition(initialValue = 0, {
  duration = 400,
  easing = quadInOut,
  maxDistance = Infinity
} = {}) {
  let startValue = initialValue;
  let startTime = Date.now();
  let targetValue = initialValue;
  let finished = true;

  function getState() {
    const stage = Math.min(1, (Date.now() - startTime) / duration);

    if (stage >= 1) {
      finished = true;
    }

    return startValue + (targetValue - startValue) * easing(stage);
  }

  function isFinished() {
    return finished;
  }

  function setTarget(value, instant) {
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
  }

  return {getState, isFinished, setTarget};
}

/**
 * Groups multiple transition so that they can be controlled as one transition
 *
 * @param {Record<string, AnimationGroup~Animation>} transitions
 * @returns AnimationGroup~Animation
 */
export function makeTransitionGroup(transitions) {
  const transitionKeys = Object.keys(transitions);

  return {
    getState() {
      const state = {};

      for (let i = 0; i < transitionKeys.length; ++i) {
        state[transitionKeys[i]] = transitions[transitionKeys[i]].getState();
      }

      return state;
    },
    isFinished() {
      for (let i = 0; i < transitionKeys.length; ++i) {
        if (!transitions[transitionKeys[i]].isFinished()) {
          return false;
        }
      }

      return true;
    },
    setTarget(targets, instant) {
      if (!targets) {
        return;
      }

      for (const key in targets) {
        if (transitions.hasOwnProperty(key)) {
          transitions[key].setTarget(targets[key], instant);
        }
      }
    }
  }
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
export function makeExponentialTransition(initialValue = 0, {minPowerValue = 1e-9, ...options} = {}) {
  function plainValueToPower(value) {
    return Math.max(Math.log(value), minPowerValue);
  }

  function powerToPlainValue(power) {
    return Math.exp(power);
  }

  const powerTransition = makeTransition(plainValueToPower(initialValue), options);

  return {
    getState() {
      return powerToPlainValue(powerTransition.getState());
    },
    isFinished: powerTransition.isFinished,
    setTarget(value, instant) {
      powerTransition.setTarget(plainValueToPower(value), instant);
    }
  };
}

/**
 * Animates the number logarithm transition. Designed for transition of the scale of an axis with a linear value
 * transition. Does opposite to `makeExponentialTransition`.
 *
 * @returns AnimationGroup~Animation
 */
export function makeLogarithmicTransition(initialValue = 0, {minValue = 1e-9, ...options} = {}) {
  function plainValueToPower(value) {
    return Math.max(Math.log(value), minValue);
  }

  function powerToPlainValue(power) {
    return Math.exp(power);
  }

  const valueTransition = makeTransition(powerToPlainValue(initialValue), options);

  return {
    getState() {
      return plainValueToPower(valueTransition.getState());
    },
    isFinished: valueTransition.isFinished,
    setTarget(value, instant) {
      valueTransition.setTarget(powerToPlainValue(value), instant);
    }
  };
}
