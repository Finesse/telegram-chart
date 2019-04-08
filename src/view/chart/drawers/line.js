import {numberColorToRGBA} from '../../../helpers/color';

/**
 * Makes an a chart line with linear interpolation. You need to specify the anchor rectangle so that the component knows
 * where to place the line. Use `drawFromX` and `drawToX` to set where to really start drawing.
 *
 * X and Y are the canvas coordinates, `values` are the data Ys and its indices are the Xs.
 */
export default function drawLine({
  ctx,
  values,
  fromX, toX, fromIndex, toIndex,
  fromY, toY, fromValue, toValue,
  drawFromX = fromX, drawToX = toX,
  color,
  lineWidth,
  opacity = 1
}) {
  if (opacity <= 0 || fromIndex === toIndex || fromValue === toValue) {
    return;
  }

  ctx.lineJoin = 'bevel';
  ctx.lineCap = 'square';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = numberColorToRGBA(color, opacity);
  ctx.beginPath();

  const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
  const yPerValue = (toY - fromY) / (toValue - fromValue);
  const xOffset = fromX - fromIndex * xPerIndex;
  const yOffset = fromY - fromValue * yPerValue;
  const realFromIndex = Math.floor(Math.max(0, fromIndex - (fromX - drawFromX + lineWidth / 2) / (xPerIndex || 1)));
  const realToIndex = Math.ceil(Math.min(values.length - 1, toIndex + (drawToX - toX + lineWidth / 2) / (xPerIndex || 1)));

  for (let i = realFromIndex; i <= realToIndex; ++i) {
    const x = xOffset + i * xPerIndex;
    const y = yOffset + values[i] * yPerValue;

    if (i === realFromIndex) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.closePath();
}
