import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {chartMapCornersRadius} from '../../../style';
import {roundedRectanglePath} from '../../../helpers/canvas';
import {TYPE_LINE, TYPE_LINE_TWO_Y} from '../../../namespace';
import drawMapLines from './mapLines';

export default function makeChartMap(ctx, type, linesData) {
  const [mainLineKey, altLineKey] = Object.keys(linesData);

  return memoizeObjectArguments(({
    canvasWidth, canvasHeight,
    minValue, maxValue, altMinValue, altMaxValue,
    pixelRatio
  }, linesOpacity) => {
    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.beginPath();
    roundedRectanglePath(ctx, 0, 0, canvasWidth, canvasHeight, chartMapCornersRadius * pixelRatio);
    ctx.clip();

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
          linesData
        }, linesOpacity);
        break;
      case TYPE_LINE_TWO_Y: {
        drawMapLines({
          ...commonArguments,
          minValue: altMinValue,
          maxValue: altMaxValue,
          linesData: {
            [altLineKey]: linesData[altLineKey]
          }
        }, linesOpacity);
        drawMapLines({
          ...commonArguments,
          minValue,
          maxValue,
          linesData: {
            [mainLineKey]: linesData[mainLineKey]
          }
        }, linesOpacity);
      }
    }

    ctx.restore();
  });
}
