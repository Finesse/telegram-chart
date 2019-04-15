export function shallowEqualObjects(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }

  if (!obj1 || !obj2) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const length = keys1.length;

  if (keys2.length !== length) {
    return false;
  }

  for (var i = 0; i < length; ++i) {
    if (obj1[keys1[i]] !== obj2[keys1[i]]) {
      return false;
    }
  }

  return true;
}

export function shallowEqualArrayOfObjects(arr1, arr2) {
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
