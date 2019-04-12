import memoizeOne from 'memoize-one';
import {rectanglePath} from '../../../helpers/canvas';

export default function makeTopFade(ctx) {
  const getGradient = memoizeOne(height => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    return gradient;
  });

  return (x, y, width, height) => {
    ctx.save();
    ctx.beginPath();
    rectanglePath(ctx, x, y, width, height);
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = getGradient(height);
    ctx.fill();
    ctx.restore();
  };
}
