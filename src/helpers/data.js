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

/**
 * @param {number[][]} dataVectors
 * @param {number} from
 * @param {number} to
 * @returns {number}
 */
export function getMaxSumOnRange(dataVectors, from, to) {
  let max = 0;

  if (dataVectors.length > 0) {
    from = Math.max(0, Math.ceil(from));
    to = Math.min(Math.floor(to), dataVectors[0].length - 1);

    for (let i = from; i <= to; ++i) {
      let sum = 0;
      for (let j = 0; j < dataVectors.length; ++j) {
        sum += dataVectors[j][i];
      }
      if (sum > max) {
        max = sum;
      }
    }
  }

  return max;
}

/**
 * @param {Record<string, {values: number[]}>} linesData
 * @param {Record<string, {enabled: boolean}>} linesState
 * @return {number[][]}
 */
export function linesObjectToVectorArray(linesData, linesState) {
  const dataVectors = [];

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key) && linesState[key].enabled) {
      dataVectors.push(linesData[key].values);
    }
  }

  return dataVectors;
}

/**
 * @param {Record<string, {values: number[]}>} lines
 * @return {Record<string, {min: value, max: value}>}
 */
export function getLinesMinAndMaxValues(lines) {
  const result = {};

  for (const [key, {values}] of Object.entries(lines)) {
    result[key] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  return result;
}

/**
 * Returns the minimum and the maximum value of the minimum and maximum values cache created by the
 * `getLinesMinAndMaxValues` function
 *
 * @param {Record<string, {min: value, max: value}>} linesMinAndMax
 * @param {Record<string, {enabled: boolean}>} linesState
 * @return {{min: number, max: number}}
 */
export function getMinAndMaxFromLinesCache(linesMinAndMax, linesState) {
  let totalMin = Infinity;
  let totalMax = -Infinity;

  for (const [key, {min, max}] of Object.entries(linesMinAndMax)) {
    if (linesState[key].enabled) {
      if (min < totalMin) {
        totalMin = min;
      }
      if (max > totalMax) {
        totalMax = max;
      }
    }
  }

  return {min: totalMin, max: totalMax};
}

/**
 * Returns the minimum and the maximum values of the data on the given range
 *
 * @param {Record<string, {values: number[]}>} linesData
 * @param {Record<string, {enabled: boolean}>} linesState
 * @param {number} startIndex
 * @param {number} endIndex
 * @return {{min: number, max: number}}
 */
export function getLinesMinAndMaxOnRange(linesData, linesState, startIndex, endIndex) {
  let totalMin = Infinity;
  let totalMax = -Infinity;

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      if (linesState[key].enabled) {
        const {min, max} = getMinAndMaxOnRange(linesData[key].values, startIndex, endIndex);
        if (min < totalMin) {
          totalMin = min;
        }
        if (max > totalMax) {
          totalMax = max;
        }
      }
    }
  }

  return {min: totalMin, max: totalMax};
}
