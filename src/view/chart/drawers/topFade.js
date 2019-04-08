import memoizeOne from 'memoize-one';
import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {backgroundColors} from '../../../style';

// todo: Check the performance impact
export default function makeTopFade(ctx) {
  const getGradient = memoizeOne((height, color) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, numberColorToRGBA(color, 1));
    gradient.addColorStop(1, numberColorToRGBA(color, 0));
    return gradient;
  });

  return (x, y, width, height, theme) => {
    ctx.fillStyle = getGradient(height, mixNumberColors(backgroundColors[0], backgroundColors[1], theme));
    ctx.fillRect(x, y, width, height);
  };
}
