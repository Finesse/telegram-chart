import memoizeOne from 'memoize-one';
import shallowEqualObjects from 'shallow-equal/objects';

function shallowEqualArrayOfObjects(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; ++i) {
    if (!shallowEqualObjects(arr1[i], arr2[i])) {
      return false;
    }
  }

  return true;
}

export default function memoizeNamedArguments(fn) {
  return memoizeOne(fn, shallowEqualArrayOfObjects);
}
