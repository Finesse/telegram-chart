import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartSidePadding, chartMainLinesTopMargin, chartMainFadeHeight} from '../../../style';
import {TYPE_AREA, TYPE_BAR, TYPE_LINE, TYPE_LINE_TWO_Y} from '../../../namespace';
import drawMainLines from './mainLines';
import makeBars from './bars';
import makePercentageArea from './percentageArea';
import drawValueScale from './valueScale';
import makeTopFade from './topFade';

export default function makeChartMainWithoutX(ctx, type, linesData, getColumnsSums) {
  const [mainLineKey, altLineKey] = Object.keys(linesData);

  const drawBars = type === TYPE_BAR ? makeBars(ctx, linesData) : () => {};
  const drawPercentageArea = type === TYPE_AREA ? makePercentageArea(ctx, linesData, getColumnsSums) : () => {};
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

      case TYPE_BAR: {
        drawBars({
          x, y, width, height,
          linesOpacity,
          fromX: mainLinesX,
          toX: mainLinesX + mainLinesWidth,
          fromIndex: startIndex,
          toIndex: endIndex,
          fromSum: minValue,
          toSum: maxValue,
          topPadding: mainLinesY - y
        });
        break;
      }

      case TYPE_AREA: {
        drawPercentageArea({
          x,
          y: mainLinesY,
          width,
          height: mainLinesHeight,
          linesData,
          linesOpacity,
          fromX: mainLinesX,
          toX: mainLinesX + mainLinesWidth,
          fromIndex: startIndex,
          toIndex: endIndex
        });
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

    if (type !== TYPE_AREA) {
      drawTopFade(x, y, width, chartMainFadeHeight * pixelRatio);
    }

    ctx.restore();
  });
}
