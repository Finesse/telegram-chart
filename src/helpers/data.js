/**
 * Gets the minimum and the maximum value of chart line on the given range
 *
 * @param {number[]} values The line values
 * @param {number} from The range start index (can be float)
 * @param {number} to The range end index (can be float)
 * @return {{min: number, max: number}}
 */
export function getMinAndMaxOnRange(values, from, to) {
  from = Math.max(0, from);
  to = Math.min(to, values.length - 1);
  let min, max;

  // Check the left edge
  min = max = interpolateLinear(values, from);

  // Check the interim values
  for (let i = Math.ceil(from), e = Math.floor(to); i <= e; ++i) {
    if (values[i] < min) {
      min = values[i];
    } else if (values[i] > max) {
      max = values[i];
    }
  }

  // Check the right edge
  const value = interpolateLinear(values, to);
  if (value < min) {
    min = value;
  } else if (value > max) {
    max = value;
  }

  return {min, max};
}

/**
 * Returns an interpolated value of the function
 *
 * @param {number[]} values The function values (indices are Xs)
 * @param {number} x The X value to interpolate
 * @return {number|undefined}
 */
export function interpolateLinear(values, x) {
  if (x < 0 || x > values.length - 1) {
    return undefined;
  }

  const x1 = Math.floor(x);
  const x2 = Math.ceil(x);

  return values[x1] + (values[x2] - values[x1]) * (x - x1)
}

