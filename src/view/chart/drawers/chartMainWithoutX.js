import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartSidePadding, chartMainLinesTopMargin, chartMainFadeHeight} from '../../../style';
import drawMainLines from './mainLines';
import drawValueScale from './valueScale';
import makeTopFade from './topFade';
import {TYPE_LINE, TYPE_LINE_TWO_Y} from "../../../namespace";

export default function makeChartMainWithoutX(ctx, type, linesData) {
  const [mainLineKey, altLineKey] = Object.keys(linesData);

  const drawTopFade = makeTopFade(ctx);

  return memoizeObjectArguments(({
    x, y, width, height,
    pixelRatio,
    minValue,
    maxValue,
    valueNotchScale,
    altMinValue,
    altMaxValue,
    altValueNotchScale,
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

    const commonArguments = {
      ctx,
      pixelRatio,
      theme
    };

    // The plot
    switch (type) {
      case TYPE_LINE:
        drawMainLines({
          ...commonArguments,
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
          toIndex: endIndex
        });
        break;

      case TYPE_LINE_TWO_Y: {
        const _commonArguments = {
          linesOpacity,
          canvasWidth: width,
          x: mainLinesX,
          y: mainLinesY,
          width: mainLinesWidth,
          height: mainLinesHeight,
          fromIndex: startIndex,
          toIndex: endIndex,
        };
        drawMainLines({
          ...commonArguments,
          ..._commonArguments,
          linesData: {
            [altLineKey]: linesData[altLineKey]
          },
          minValue: altMinValue,
          maxValue: altMaxValue
        });
        drawMainLines({
          ...commonArguments,
          ..._commonArguments,
          linesData: {
            [mainLineKey]: linesData[mainLineKey]
          },
          minValue,
          maxValue
        });
        break;
      }
    }

    // The value scale
    const commonScaleArguments = {
      ...commonArguments,
      x: mainLinesX,
      y,
      width: mainLinesWidth,
      height,
      topPadding: mainLinesY - y
    };

    if (type === TYPE_LINE_TWO_Y) {
      drawValueScale({
        ...commonScaleArguments,
        fromValue: minValue,
        toValue: maxValue,
        notchScale: valueNotchScale,
        drawLines: linesOpacity[mainLineKey] > 0,
        labelColor: linesData[mainLineKey].color,
        labelOpacity: linesOpacity[mainLineKey]
      });
      drawValueScale({
        ...commonScaleArguments,
        fromValue: altMinValue,
        toValue: altMaxValue,
        notchScale: altValueNotchScale,
        drawLines: linesOpacity[mainLineKey] <= 0,
        labelColor: linesData[altLineKey].color,
        labelOpacity: linesOpacity[altLineKey],
        labelOnRight: true
      });
    } else {
      drawValueScale({
        ...commonScaleArguments,
        fromValue: minValue,
        toValue: maxValue,
        notchScale: valueNotchScale
      });
    }

    drawTopFade(x, y, width, chartMainFadeHeight * pixelRatio);

    ctx.restore();
  });
}
