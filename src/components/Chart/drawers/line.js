import * as PIXI from '../../../pixi';
import {hexToNumber} from '../../../helpers/color';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';

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
      opacity = 1
    }) => {
      path.clear();

      if (opacity <= 0 || fromIndex === toIndex || fromValue === toValue) {
        return;
      }

      const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
      const yPerValue = (toY - fromY) / (toValue - fromValue);
      const realFromIndex = Math.floor(Math.max(0, fromIndex - (xPerIndex === 0 ? 0 : (fromX + width / 2) / xPerIndex)));
      const realToIndex = Math.ceil(Math.min(values.length - 1, toIndex + (xPerIndex === 0 ? 0 : (canvasWidth - toX + width / 2) / xPerIndex)));

      path.lineStyle(width, hexToNumber(color), opacity, 0.5);

      for (let i = realFromIndex; i <= realToIndex; ++i) {
        const x = fromX + (i - fromIndex) * xPerIndex;
        const y = fromY + (values[i] - fromValue) * yPerValue;

        if (i === realFromIndex) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
    })
  };
}
