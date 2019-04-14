import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {mixNumbers} from '../../../helpers/number';
import {chartScaleLineColors, chartScaleLineOpacities, chartScaleLineWidth} from '../../../style';

export default function drawColumnPointerLine({
  ctx, pixelRatio, theme,
  x, y, height,
  opacity,
  drawFromX = -Infinity, drawToX = Infinity,
}) {
  if (opacity <= 0) {
    return;
  }

  const lineWidth = chartScaleLineWidth * pixelRatio;
  const lineX = Math.round(x - lineWidth / 2);

  if (lineX + lineWidth <= drawFromX || lineX >= drawToX) {
    return;
  }

  const lineColor = mixNumberColors(chartScaleLineColors[0], chartScaleLineColors[1], theme);
  const lineOpacity = mixNumbers(chartScaleLineOpacities[0], chartScaleLineOpacities[1], theme);

  ctx.fillStyle = numberColorToRGBA(lineColor, lineOpacity * opacity);
  ctx.fillRect(lineX, y, lineWidth, height);
}
