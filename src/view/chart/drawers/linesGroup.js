import drawLine from './line';

export default function drawLinesGroup({
  ctx,
  linesData, linesOpacity,
  x, width,
  fromX, toX, fromIndex, toIndex,
  fromY, toY, fromValue, toValue,
  lineWidth
}) {
  for (let key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      drawLine({
        ctx,
        values: linesData[key].values,
        fromX,
        toX,
        fromY,
        toY,
        drawFromX: x,
        drawToX: x + width,
        fromIndex,
        toIndex,
        fromValue,
        toValue,
        color: linesData[key].color,
        lineWidth,
        opacity: linesOpacity[key]
      });
    }
  }
}
