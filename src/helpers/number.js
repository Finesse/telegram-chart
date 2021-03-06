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

const shortNumberSuffixes = ['K', 'M', 'B'];

export function formatNumberToShortForm(number) {
  const suffixPower = getNumberSuffixPower(number);

  return suffixPower === 0
    ? String(number)
    : number / (1000 ** suffixPower) + shortNumberSuffixes[suffixPower - 1];
}

function getNumberSuffixPower(number) {
  if (number === 0) {
    return 0;
  }

  for (let power = 1; power <= shortNumberSuffixes.length; ++power) {
    const base = 1000 ** power;

    if (number % base !== 0) {
      return power - 1;
    }
  }

  return shortNumberSuffixes.length;
}

export function formatNumberWithThousandGroups(number, divider = ' ') {
  const [integer, fractional] = String(number).split('.');
  const digitsCount = integer.length;
  let groupedInteger = '';

  for (let i = 0; i < digitsCount; i += 3) {
    groupedInteger = integer.slice(Math.max(0, digitsCount - i - 3), digitsCount - i)
      + (groupedInteger ? divider + groupedInteger : '');
  }

  return groupedInteger + (fractional ? '.' + fractional : '');
}

export function inRange(min, value, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

// https://stackoverflow.com/q/4467539/1118709
export function modulo(dividend, divider) {
  return ((dividend % divider) + divider) % divider;
}
