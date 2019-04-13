import {chartMapLineWidth, chartMapLinesHorizontalMargin, chartMapLinesVerticalMargin} from '../../../style';
import drawLine from './line';

export default function drawMapLines({
  ctx,
  x, y, width, height,
  canvasWidth, canvasHeight,
  minValue, maxValue,
  linesData,
  pixelRatio
}, linesOpacity) {
  const lineWidth = chartMapLineWidth * pixelRatio;
  const fromX = x + chartMapLinesHorizontalMargin * pixelRatio;
  const toX = x + width - chartMapLinesHorizontalMargin * pixelRatio;
  const toY = y + chartMapLinesVerticalMargin * pixelRatio;
  const fromY = y + height - chartMapLinesVerticalMargin * pixelRatio;

  for (let key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      const {values, color} = linesData[key];

      drawLine({
        ctx,
        values,
        fromX,
        toX,
        fromY,
        toY,
        drawFromX: x,
        drawToX: x + width,
        fromIndex: 0,
        toIndex: values.length - 1,
        fromValue: minValue,
        toValue: maxValue,
        color,
        lineWidth,
        opacity: linesOpacity[key]
      });
    }
  }
}
