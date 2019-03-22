import {mixNumbers} from './number';

export function hexToNumber(color) {
  return parseInt(color.slice(1), 16);
}

/**
 * Ratio values: 0 - color1, 1 - color2
 */
export function mixNumberColors(color1, color2, ratio) {
  const r1 = (color1 >> 16) % 0x100;
  const g1 = (color1 >> 8) % 0x100;
  const b1 = color1 % 0x100;

  const r2 = (color2 >> 16) % 0x100;
  const g2 = (color2 >> 8) % 0x100;
  const b2 = color2 % 0x100;

  return mixNumbers(r1, r2, ratio) << 16 | mixNumbers(g1, g2, ratio) << 8 | mixNumbers(b1, b2, ratio);
}
