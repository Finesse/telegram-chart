import interpolateLinear from './interpolateLinear';

/**
 * Gets the maximum value of chart line on the given range
 *
 * @param {number[]} values The line values
 * @param {number} from The range start index (can be float)
 * @param {number} to The range end index (can be float)
 * @return {number}
 */
export default function getMaxOnRange(values, from, to) {
  from = Math.max(0, from);
  to = Math.min(to, values.length);

  // Check the left edge
  let max = interpolateLinear(values, from);

  // Check the interim values
  for (let i = Math.ceil(from), e = Math.floor(to); i < e; ++i) {
    if (values[i] > max) {
      max = values[i];
    }
  }

  // Check the right edge
  const value = interpolateLinear(values, to);
  if (value > max) {
    max = value;
  }

  return max;
}
