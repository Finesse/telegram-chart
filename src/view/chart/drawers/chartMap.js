import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartMapBarsVerticalPadding} from '../../../style';
import {TYPE_BAR, TYPE_LINE, TYPE_LINE_TWO_Y} from '../../../namespace';
import drawMapLines from './mapLines';
import makeBars from './bars';

export default function makeChartMap(ctx, type, linesData, minIndex, maxIndex) {
  const [mainLineKey, altLineKey] = Object.keys(linesData);

  const drawBars = type === TYPE_BAR ? makeBars(ctx, linesData) : () => {};

  return memoizeObjectArguments(({
    canvasWidth, canvasHeight,
    minValue, maxValue, altMinValue, altMaxValue,
    pixelRatio
  }, linesOpacity) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const commonArguments = {
      ctx,
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      pixelRatio
    };

    switch (type) {
      case TYPE_LINE:
        drawMapLines({
          ...commonArguments,
          minValue,
          maxValue,
          linesData,
          linesOpacity
        });
        break;
      case TYPE_LINE_TWO_Y: {
        drawMapLines({
          ...commonArguments,
          minValue: altMinValue,
          maxValue: altMaxValue,
          linesData: {
            [altLineKey]: linesData[altLineKey]
          },
          linesOpacity
        });
        drawMapLines({
          ...commonArguments,
          minValue,
          maxValue,
          linesData: {
            [mainLineKey]: linesData[mainLineKey]
          },
          linesOpacity
        });
        break;
      }
      case TYPE_BAR: {
        drawBars({
          ...commonArguments,
          linesData,
          linesOpacity,
          fromX: 0,
          toX: canvasWidth,
          fromIndex: minIndex,
          toIndex: maxIndex,
          fromSum: minValue,
          toSum: maxValue,
          topPadding: chartMapBarsVerticalPadding * pixelRatio
        });
        break;
      }
    }
  });
}
