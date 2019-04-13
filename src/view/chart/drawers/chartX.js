import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartSidePadding, chartDateScaleLabelMargin, chartMapHeight, chartMapBottom} from '../../../style';
import drawDateScale from './dateScale';
import drawMapSelector from './mapSelector';

export default function makeChartX(ctx, dates, minIndex, maxIndex) {
  return memoizeObjectArguments(({
    x, y, width, height,
    pixelRatio,
    startIndex,
    endIndex,
    dateNotchScale,
    theme
  }) => {
    ctx.clearRect(x, y, width, height);

    drawDateScale({
      ctx,
      dates,
      x: x,
      y: y + chartDateScaleLabelMargin * pixelRatio,
      width: width,
      fromX: x + chartSidePadding * pixelRatio,
      toX: x + width - chartSidePadding * pixelRatio,
      fromIndex: startIndex,
      toIndex: endIndex,
      notchScale: dateNotchScale,
      pixelRatio,
      theme
    });

    if (minIndex !== maxIndex) {
      drawMapSelector({
        ctx,
        x: x + chartSidePadding * pixelRatio,
        y: y + height - (chartMapHeight + chartMapBottom) * pixelRatio,
        width: width - chartSidePadding * pixelRatio * 2,
        height: chartMapHeight * pixelRatio,
        from: (startIndex - minIndex) / (maxIndex - minIndex),
        to: (endIndex - minIndex) / (maxIndex - minIndex),
        pixelRatio,
        theme
      });
    }
  });
}
