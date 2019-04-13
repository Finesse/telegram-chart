import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartSidePadding, chartMainLinesTopMargin, chartMainFadeHeight} from '../../../style';
import drawMainLines from './mainLines';
import drawValueScale from './valueScale';
import makeTopFade from './topFade';

export default function makeChartMainWithoutX(ctx, linesData) {
  const drawTopFade = makeTopFade(ctx);

  return memoizeObjectArguments(({
    x, y, width, height,
    pixelRatio,
    minValue,
    maxValue,
    valueNotchScale,
    startIndex,
    endIndex,
    theme
  }, linesOpacity) => {
    const mainLinesX = x + chartSidePadding * pixelRatio;
    const mainLinesY = y + chartMainLinesTopMargin * pixelRatio;
    const mainLinesWidth = width - chartSidePadding * pixelRatio * 2;
    const mainLinesHeight = height - chartMainLinesTopMargin * pixelRatio;

    ctx.save();
    ctx.clearRect(x, y, width, height);
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    drawMainLines({
      ctx,
      linesData,
      linesOpacity,
      canvasWidth: width,
      x: mainLinesX,
      y: mainLinesY,
      width: mainLinesWidth,
      height: mainLinesHeight,
      minValue,
      maxValue,
      fromIndex: startIndex,
      toIndex: endIndex,
      pixelRatio
    });

    drawValueScale({
      ctx,
      x: mainLinesX,
      y,
      width: mainLinesWidth,
      height,
      fromValue: minValue,
      toValue: maxValue,
      notchScale: valueNotchScale,
      topPadding: mainLinesY - y,
      theme,
      pixelRatio
    });

    drawTopFade(x, y, width, chartMainFadeHeight * pixelRatio);

    ctx.restore();
  });
}
