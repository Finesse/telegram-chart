import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {interpolateLinear} from '../../../helpers/data';
import {chartLinePointerRadius, chartMainLineWidth, backgroundColors} from '../../../style';

export default function drawLinesPointer({
  ctx, pixelRatio, theme,
  linesData, linesOpacity,
  x, y, height,
  index, // May be not integer
  opacity,
  fromY = y + height, toY = y, fromValue, toValue,
  drawFromX = -Infinity, drawToX = Infinity
}) {
  if (opacity <= 0 || fromValue === toValue) {
    return;
  }

  const pointRadius = chartLinePointerRadius * pixelRatio;
  const borderWidth = chartMainLineWidth * pixelRatio;

  x = Math.round(x);
  if (
    x + pointRadius + borderWidth / 2 <= drawFromX ||
    x - pointRadius - borderWidth / 2 >= drawToX
  ) {
    return;
  }

  const yPerValue = (toY - fromY) / (toValue - fromValue);
  const pointBackgroundColor = mixNumberColors(backgroundColors[0], backgroundColors[1], theme);
  ctx.lineWidth = borderWidth;

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      const lineOpacity = linesOpacity[key];
      if (lineOpacity <= 0) {
        continue;
      }

      const {color, values} = linesData[key];
      const value = interpolateLinear(values, index);
      const y = fromY + (value - fromValue) * yPerValue;
      const scale = 0.3 + opacity * 0.7;

      ctx.fillStyle = numberColorToRGBA(pointBackgroundColor, lineOpacity * opacity);
      ctx.strokeStyle = numberColorToRGBA(color, lineOpacity * opacity);
      ctx.beginPath();
      ctx.arc(x, y, pointRadius * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
