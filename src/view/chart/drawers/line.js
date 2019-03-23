import * as PIXI from '../../../pixi';
import {hexToNumber} from '../../../helpers/color';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import interpolateLinear from '../../../helpers/interpolateLinear';

/**
 * Makes an a chart line with linear interpolation. The line is rendered from the left edge of the canvas to the right
 * edge. You need to specify the anchor rectangle so that the component knows where to place the line.
 *
 * X and Y are the SVG coordinates, `values` are the data Ys and its indices are the Xs.
 */
export default function makeLine({values, color, width}) {
  const path = new PIXI.Graphics();

  return {
    stageChild: path,
    update: memoizeObjectArguments(({
      canvasWidth,
      fromIndex,
      toIndex,
      fromX = 0,
      toX = canvasWidth,
      fromValue,
      toValue,
      fromY,
      toY,
      opacity = 1,
      roundCorners = false
    }) => {
      path.clear();

      if (opacity <= 0 || fromIndex === toIndex || fromValue === toValue) {
        return;
      }

      const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
      const yPerValue = (toY - fromY) / (toValue - fromValue);
      const realFromIndex = Math.floor(Math.max(0, fromIndex - (xPerIndex === 0 ? 0 : (fromX + width / 2) / xPerIndex)));
      const realToIndex = Math.ceil(Math.min(values.length - 1, toIndex + (xPerIndex === 0 ? 0 : (canvasWidth - toX + width / 2) / xPerIndex)));
      const roundCornerXOffset = roundCorners ? Math.min(0.5, 0.01 * xPerIndex) : 0;

      path.lineStyle(width, hexToNumber(color), opacity, 0.5);

      for (let i = realFromIndex; i <= realToIndex; ++i) {
        const x = fromX + (i - fromIndex) * xPerIndex;
        const y = fromY + (values[i] - fromValue) * yPerValue;

        if (i === realFromIndex) {
          path.moveTo(x, y);
          continue;
        }

        // Don't need to round the corner if...
        if (
          i === realToIndex || // It is the last point
          roundCornerXOffset <= 0 || // The rounding is disabled
          (values[i - 1] > values[i]) === (values[i] > values[i + 1]) // Or the corner is not sharp
        ) {
          path.lineTo(x, y);
          continue;
        }

        // This flat rounding is almost indistinguishable from the real bezier rounding and much faster
        const x1 = x - roundCornerXOffset;
        const y1 = fromY + interpolateLinear(values, i - roundCornerXOffset / xPerIndex) * yPerValue;
        const x2 = x + roundCornerXOffset;
        const y2 = fromY + interpolateLinear(values, i + roundCornerXOffset / xPerIndex) * yPerValue;
        const y12 = y1 * 0.3 + y2 * 0.3 + y * 0.4;
        path
          .lineTo(x1, y12)
          .lineTo(x2, y12);
      }
    })
  };
}
