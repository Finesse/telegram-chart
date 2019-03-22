// https://stackoverflow.com/q/4467539/1118709
export function modulo(dividend, divider) {
  return ((dividend % divider) + divider) % divider;
}

/**
 * Ratio values: 0 - number1, 1 - number2
 */
export function mixNumbers(number1, number2, ratio) {
  return number1 * (1 - ratio) + number2 * ratio;
}
