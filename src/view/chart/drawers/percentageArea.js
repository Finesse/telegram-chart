import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {numberColorToRGBA} from '../../../helpers/color';

export default function makePercentageArea(ctx, linesData, getColumnsTotal = makeGetColumnsSums(linesData)) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;
  const columnsCurrentSums = new Float32Array(dataLength);

  return function drawPercentageArea({
    x, y, width, height,
    linesOpacity,
    fromX, toX, fromIndex, toIndex
  }) {
    if (fromIndex === toIndex || fromX === toX) {
      return;
    }

    const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
    const drawFromIndex = fromIndex - (fromX - x) / xPerIndex;
    const drawToIndex = toIndex + (x + width - toX) / xPerIndex;
    const realFromIndex = Math.max(0, Math.floor(drawFromIndex));
    const realToIndex = Math.min(Math.ceil(drawToIndex), dataLength - 1);
    const columnsSums = getColumnsTotal(linesOpacity);
    let wasLineDrawn = false;

    for (let i = realFromIndex; i <= realToIndex; ++i) {
      columnsCurrentSums[i] = 0;
    }

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];
      const scale = opacityToScale(linesOpacity[key]);

      if (scale <= 0) {
        continue;
      }

      const {values, color} = linesData[key];
      ctx.fillStyle = numberColorToRGBA(color);

      // todo: Try to optimize by drawing less area at the top
      if (wasLineDrawn) {
        ctx.beginPath();
        ctx.moveTo(fromX + (realFromIndex - fromIndex) * xPerIndex, y);

        for (let i = realFromIndex; i <= realToIndex; ++i) {
          const yPosition = columnsSums[i] === 0 ? 0.5 : columnsCurrentSums[i] / columnsSums[i];

          ctx.lineTo(
            fromX + (i - fromIndex) * xPerIndex,
            y + (1 - yPosition) * height
          );

          columnsCurrentSums[i] += values[i] * scale;
        }

        ctx.lineTo(fromX + (realToIndex - fromIndex) * xPerIndex, y);
        ctx.fill();
      } else {
        ctx.fillRect(
          fromX + (realFromIndex - fromIndex) * xPerIndex, y,
          (realToIndex - realFromIndex) * xPerIndex, height
        );

        for (let i = realFromIndex; i <= realToIndex; ++i) {
          columnsCurrentSums[i] += values[i] * scale;
        }
      }

      wasLineDrawn = true;
    }
  }
}

export function makeGetColumnsSums(linesData) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;
  const sums = new Float32Array(dataLength);

  // Warning! The result array may be changed by reference
  return memoizeObjectArguments(linesOpacity => {
    for (let i = 0; i < dataLength; ++i) {
      sums[i] = 0;
    }

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];
      const scale = opacityToScale(linesOpacity[key]);

      if (scale > 0) {
        for (let i = 0; i < dataLength; ++i) {
          sums[i] += linesData[key].values[i] * scale;
        }
      }
    }

    return sums;
  });
}

function opacityToScale(opacity) {
  return opacity;
}
