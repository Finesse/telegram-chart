/**
 * Returns an interpolated value of the function
 *
 * @param {number[]} values The function values (indices are Xs)
 * @param {number} x The X value to interpolate
 * @return {number|undefined}
 */
export default function interpolateLinear(values, x) {
  if (x < 0 || x > values.length - 1) {
    return undefined;
  }

  const x1 = Math.floor(x);
  const x2 = Math.ceil(x);

  return values[x1] + (values[x2] - values[x1]) * (x - x1)
}
