import {memoizeObjectArguments} from '../../../helpers/memoize';
import {numberColorToRGBA} from '../../../helpers/color';

export default function makePercentageArea(ctx, linesData, cache = makePercentageAreaCache(linesData)) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;

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
    const {linesCache, maxOpacity} = cache(linesOpacity);
    let lastDrawnLineCache;

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];
      const lineCache = linesCache[key];

      if (!lineCache.display) {
        continue;
      }

      ctx.fillStyle = numberColorToRGBA(linesData[key].color, maxOpacity);

      // todo: Try to optimize by drawing less area at the top
      if (lastDrawnLineCache) {
        ctx.beginPath();
        ctx.moveTo(fromX + (realFromIndex - fromIndex) * xPerIndex, y);

        for (let i = realFromIndex; i <= realToIndex; ++i) {
          ctx.lineTo(
            fromX + (i - fromIndex) * xPerIndex,
            y + (1 - lastDrawnLineCache.positions[i]) * height
          );
        }

        ctx.lineTo(fromX + (realToIndex - fromIndex) * xPerIndex, y);
        ctx.fill();
      } else {
        ctx.fillRect(
          fromX + (realFromIndex - fromIndex) * xPerIndex, y,
          (realToIndex - realFromIndex) * xPerIndex, height
        );
      }

      lastDrawnLineCache = lineCache;
    }
  }
}

export function makePercentageAreaCache(linesData) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;
  const linesCache = {};

  for (let i = 0; i < linesKeys.length; ++i) {
    linesCache[linesKeys[i]] = {
      display: false,
      positions: new Float32Array(dataLength)
    };
  }

  // Warning! The result object may be changed by reference
  return memoizeObjectArguments(linesOpacity => {
    let maxOpacity = 0;

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];
      const opacity = linesOpacity[key];
      linesCache[key].display = opacity > 0;

      if (opacity > maxOpacity) {
        maxOpacity = opacity;
      }
    }

    for (let i = 0; i < dataLength; ++i) {
      let sum = 0;
      for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
        const key = linesKeys[keyI];
        if (linesCache[key].display) {
          sum += linesData[key].values[i] * linesOpacity[key];
        }
      }

      let currentSum = 0;
      for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
        const key = linesKeys[keyI];
        const opacity = linesOpacity[key];
        if (linesCache[key].display) {
          currentSum += linesData[key].values[i] * opacity;
          linesCache[key].positions[i] = sum === 0 ? 0.5 : currentSum / sum;
        }
      }
    }

    return {
      linesCache,
      maxOpacity
    };
  });
}
