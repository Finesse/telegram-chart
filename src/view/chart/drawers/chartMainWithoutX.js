import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {
  chartSidePadding,
  chartMainLinesTopMargin,
  chartMainFadeHeight,
  chartScaleLineWidth,
  chartMainLineWidth
} from '../../../style';
import {TYPE_AREA, TYPE_BAR, TYPE_LINE, TYPE_LINE_TWO_Y} from '../../../namespace';
import drawLinesGroup from './linesGroup';
import makeBars from './bars';
import makePercentageArea from './percentageArea';
import drawValueScale from './valueScale';
import makeTopFade from './topFade';
import drawColumnPointerLine from './columnPointerLine';
import drawColumnPointerCircles from './columnPointerCircles';

export default function makeChartMainWithoutX(ctx, type, linesData, percentageAreaCache) {
  const [mainLineKey, altLineKey] = Object.keys(linesData);

  const drawBars = type === TYPE_BAR ? makeBars(ctx, linesData) : () => {};
  const drawPercentageArea = type === TYPE_AREA ? makePercentageArea(ctx, linesData, percentageAreaCache) : () => {};
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
    detailsIndex,
    detailsOpacity,
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
        drawLinesGroup({
          ctx,
          linesData,
          linesOpacity,
          x,
          width,
          fromX: mainLinesX,
          toX: mainLinesX + mainLinesWidth,
          fromIndex: startIndex,
          toIndex: endIndex,
          fromY: mainLinesY + mainLinesHeight,
          toY: mainLinesY,
          fromValue: minValue,
          toValue: maxValue,
          lineWidth: chartMainLineWidth * pixelRatio
        });
        break;

      case TYPE_LINE_TWO_Y: {
        const _commonArguments = {
          ctx,
          linesOpacity,
          x,
          width,
          fromX: mainLinesX,
          toX: mainLinesX + mainLinesWidth,
          fromIndex: startIndex,
          toIndex: endIndex,
          fromY: mainLinesY + mainLinesHeight,
          toY: mainLinesY,
          lineWidth: chartMainLineWidth * pixelRatio
        };
        drawLinesGroup({
          ..._commonArguments,
          linesData: {
            [altLineKey]: linesData[altLineKey]
          },
          fromValue: altMinValue,
          toValue: altMaxValue
        });
        drawLinesGroup({
          ..._commonArguments,
          linesData: {
            [mainLineKey]: linesData[mainLineKey]
          },
          fromValue: minValue,
          toValue: maxValue
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
          topPadding: mainLinesY - y,
          highlightIndex: detailsIndex,
          highlightPower: detailsOpacity
        });
        break;
      }

      case TYPE_AREA: {
        drawPercentageArea({
          x,
          y: mainLinesY - chartScaleLineWidth * pixelRatio,
          width,
          height: mainLinesHeight + chartScaleLineWidth * pixelRatio,
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

    // The details pointer
    if (detailsOpacity > 0) {
      const detailsX = mainLinesX + mainLinesWidth * (detailsIndex - startIndex) / (endIndex - startIndex);

      switch (type) {
        case TYPE_LINE:
        case TYPE_LINE_TWO_Y:
        case TYPE_AREA:
          drawColumnPointerLine({
            ...commonArguments,
            x: detailsX,
            y: mainLinesY,
            height: mainLinesHeight,
            opacity: detailsOpacity,
            drawFromX: x,
            drawToX: x + width
          });
          break;
      }

      switch (type) {
        case TYPE_LINE:
          drawColumnPointerCircles({
            ...commonArguments,
            linesData,
            linesOpacity,
            x: detailsX,
            y: mainLinesY,
            height: mainLinesHeight,
            index: detailsIndex,
            opacity: detailsOpacity,
            fromValue: minValue,
            toValue: maxValue,
            drawFromX: x,
            drawToX: x + width
          });
          break;
        case TYPE_LINE_TWO_Y: {
          const _commonArguments = {
            linesOpacity,
            x: detailsX,
            y: mainLinesY,
            height: mainLinesHeight,
            index: detailsIndex,
            opacity: detailsOpacity,
            drawFromX: x,
            drawToX: x + width
          };
          drawColumnPointerCircles({
            ...commonArguments,
            ..._commonArguments,
            linesData: {
              [altLineKey]: linesData[altLineKey]
            },
            fromValue: altMinValue,
            toValue: altMaxValue
          });
          drawColumnPointerCircles({
            ...commonArguments,
            ..._commonArguments,
            linesData: {
              [mainLineKey]: linesData[mainLineKey]
            },
            fromValue: minValue,
            toValue: maxValue
          });
          break;
        }
      }
    }
  });
}
