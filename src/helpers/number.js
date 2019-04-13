/**
 * Ratio values: 0 - number1, 1 - number2
 */
export function mixNumbers(number1, number2, ratio) {
  return number1 * (1 - ratio) + number2 * ratio;
}

export function roundWithBase(number, base) {
  return Math.round(number / base) * base;
}

export function floorWithBase(number, base) {
  return Math.floor(number / base) * base;
}

export function ceilWithBase(number, base) {
  return Math.ceil(number / base) * base;
}

// https://stackoverflow.com/q/4467539/1118709
export function modulo(dividend, divider) {
  return ((dividend % divider) + divider) % divider;
}
