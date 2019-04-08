import {chartMainLineWidth} from '../../../style';
import drawLine from './line';

export default function drawMainLines({
  ctx,
  linesData,
  linesOpacity,
  canvasWidth,
  x, y,
  width, height,
  minValue,
  maxValue,
  fromIndex,
  toIndex,
  pixelRatio
}) {
  const lineWidth = chartMainLineWidth * pixelRatio;

  for (let key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      const {values, color} = linesData[key];

      drawLine({
        ctx,
        values,
        fromX: x,
        toX: x + width,
        fromY: y + height,
        toY: y,
        drawFromX: 0,
        drawToX: canvasWidth,
        fromIndex,
        toIndex,
        fromValue: minValue,
        toValue: maxValue,
        color,
        lineWidth,
        opacity: linesOpacity[key]
      });
    }
  }
}
