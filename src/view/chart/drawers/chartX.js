import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartSidePadding, chartDateScaleLabelMargin, chartMapHeight, chartMapBottom} from '../../../style';
import drawDateScale from './dateScale';
import drawMapSelector from './mapSelector';

export default function makeChartX(ctx, dates) {
  const dataLength = dates.length - 1;

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

    if (dataLength !== 0) {
      drawMapSelector({
        ctx,
        x: x + chartSidePadding * pixelRatio,
        y: y + height - (chartMapHeight + chartMapBottom) * pixelRatio,
        width: width - chartSidePadding * pixelRatio * 2,
        height: chartMapHeight * pixelRatio,
        from: startIndex / dataLength,
        to: endIndex / dataLength,
        pixelRatio,
        theme
      });
    }
  });
}
