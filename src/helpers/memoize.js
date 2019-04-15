import {shallowEqualArrayOfObjects} from './shallowEqual';

function shallowArgumentsEqual(lastArguments, newArguments) {
  if (lastArguments.length !== newArguments.length) {
    return false;
  }

  for (let i = 0; i < lastArguments.length; i++) {
    if (lastArguments[i] !== newArguments[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Remembers the last return result of the function
 */
export function memoize(fn, areArgumentsEqual = shallowArgumentsEqual) {
  let lastArguments = [];
  let lastResult;
  let wasCalled = false;

  return function memoized() {
    if (wasCalled && areArgumentsEqual(lastArguments, arguments)) {
      return lastResult;
    }

    lastResult = fn(...arguments);
    wasCalled = true;
    lastArguments = arguments;
    return lastResult;
  }
}

export function memoizeObjectArguments(fn) {
  return memoize(fn, shallowEqualArrayOfObjects);
}
