import {modulo, floorWithBase} from './number';

export const dateNotchScaleBase = 2;

const dateNotchScaleBaseLog = Math.log(dateNotchScaleBase);

export function getDateNotchScale(datesCount, maxNotchesCount = 6) {
  if (datesCount <= 0) {
    return 1e9;
  }

  return Math.max(0, Math.ceil(Math.log(datesCount / maxNotchesCount) / dateNotchScaleBaseLog));
}

const log10Of2 = Math.log10(2);
const log10Of5 = Math.log10(5);

/**
 * Returns a number meaning what human-readable number can be used to fit the given value
 *
 * @param {number} value
 * @param {number} [doRoundUp=false] Do round to the greater number? Otherwise to the lower.
 * @returns {number} 0 for 1, 1 for 2, 2 for 5, 3 for 10, 4 for 20, 5 for 50 and so on
 */
export function getSubDecimalScale(value, doRoundUp) {
  const log10 = Math.log10(value);
  const log10Base = Math.floor(log10);
  const log10Remainder = modulo(log10, 1);

  if (log10 === -Infinity) {
    return -Infinity;
  }

  if (log10Remainder === 0 || !doRoundUp && log10Remainder < log10Of2) {
    return log10Base * 3;
  }
  if (log10Remainder <= log10Of2 || !doRoundUp && log10Remainder < log10Of5) {
    return log10Base * 3 + 1;
  }
  if (log10Remainder <= log10Of5 || !doRoundUp) {
    return log10Base * 3 + 2;
  }
  return log10Base * 3 + 3;
}

/**
 * Converts the result of `getSubDecimalScale` back to a plain number
 *
 * @param {number} scale
 * @returns {number} 1 for 0, 2 for 1, 5 for 2, 10 for 3, 20 for 4, 50 for 5 and so on
 */
export function subDecimalScaleToNumber(scale) {
  const base = 10 ** Math.floor(scale / 3);
  const remainder = modulo(scale, 3);

  if (remainder < 1) {
    return base;
  }
  if (remainder < 2) {
    return base * 2;
  }
  return base * 5;
}

/**
 * Calculates the scale such way that the notches always stay in the same place unless the `notchCount` argument value
 * is changed.
 *
 * @param {number} minValue The minimum value to fit on the scale
 * @param {number} maxValue The maximum value to fit on the scale
 * @param {number} notchCount The number of notches to render. May be not integer (will be aligned to the minimal value).
 * @returns {{min: number, max: number, notchScale: number}} Turn the notch scale to a plain number using the
 *  `subDecimalScaleToNumber` function
 */
export function getValueRangeForFixedNotches(minValue, maxValue, notchCount = 5) {
  function getValueRange(notchScale) {
    const notchValue = subDecimalScaleToNumber(notchScale);
    const alignedMinValue = floorWithBase(minValue, notchValue);
    const alignedMaxValue = alignedMinValue + notchValue * notchCount;
    return [alignedMinValue, alignedMaxValue];
  }

  let notchScale = Math.max(-1e9, getSubDecimalScale(Math.max(1e-9, Math.abs((maxValue - minValue) / notchCount)), true));
  let [min, max] = getValueRange(notchScale);

  if (max < maxValue) {
    [min, max] = getValueRange(++notchScale);
  }

  return {min, max, notchScale};
}

/**
 * Calculates the scale such way that the lowest notch is always at the button.
 *
 * @see getValueRangeForFixedNotches for arguments and return value
 */
export function getValueRangeForFixedBottom(minValue, maxValue, maxNotchCount = 5) {
  const {min, notchScale} = getValueRangeForFixedNotches(minValue, maxValue, maxNotchCount);
  return {min, max: maxValue, notchScale};
}
