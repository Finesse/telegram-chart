import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {
  chartMapLineWidth,
  chartMapLinesHorizontalMargin,
  chartMapLinesVerticalMargin,
  chartMapCornersRadius,
} from '../../../style';
import {roundedRectanglePath} from '../../../helpers/canvas';
import drawLine from './line';

export default function makeMapLines(ctx, linesData) {
  return memoizeObjectArguments(({
    canvasWidth, canvasHeight,
    maxValue,
    pixelRatio
  }, linesOpacity) => {
    const lineWidth = chartMapLineWidth * pixelRatio;
    const fromX = chartMapLinesHorizontalMargin * pixelRatio;
    const toX = canvasWidth - fromX;
    const toY = chartMapLinesVerticalMargin * pixelRatio;
    const fromY = canvasHeight - toY;

    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.beginPath();
    roundedRectanglePath(ctx, 0, 0, canvasWidth, canvasHeight, chartMapCornersRadius * pixelRatio);
    ctx.clip();

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
          drawFromX: 0,
          drawToX: canvasWidth,
          fromIndex: 0,
          toIndex: values.length - 1,
          fromValue: 0,
          toValue: maxValue,
          color,
          lineWidth,
          opacity: linesOpacity[key]
        });
      }
    }

    ctx.restore();
  });
}
