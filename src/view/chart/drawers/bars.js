import {numberColorToRGBA} from '../../../helpers/color';

// todo: Fix the Pears animation
export default function makeBars(ctx, linesData) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;
  const columnsCurrentY = new Array(dataLength);

  return function drawBars({
    x, y, width, height,
    linesOpacity,
    fromX, toX, fromIndex, toIndex,
    fromSum, toSum,
    topPadding = 0
  }) {
    if (fromIndex === toIndex || fromX === toX || toSum === fromSum) {
      return;
    }

    const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
    const yPerValue = (topPadding - height) / (toSum - fromSum);
    const drawFromIndex = fromIndex - (fromX - x) / xPerIndex - 0.6;
    const drawToIndex = toIndex + (x + width - toX) / xPerIndex + 0.6;
    const realFromIndex = Math.max(0, Math.ceil(drawFromIndex));
    const realToIndex = Math.min(Math.floor(drawToIndex), dataLength - 1);
    const columnsInitialY = y + height - fromSum * yPerValue;

    for (let i = realFromIndex; i <= realToIndex; ++i) {
      columnsCurrentY[i] = columnsInitialY; // Keep it float
    }

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];
      const opacity = linesOpacity[key];

      if (opacity <= 0) {
        continue;
      }

      const {values, color} = linesData[key];
      let currentX = Math.round(fromX + (realFromIndex - 0.5 - fromIndex) * xPerIndex);

      ctx.fillStyle = numberColorToRGBA(color);

      for (let index = realFromIndex; index <= realToIndex; ++index) {
        const currentY = Math.round(columnsCurrentY[index]);
        const nextX = Math.round(fromX + (index + 0.5 - fromIndex) * xPerIndex);
        const nextY = columnsCurrentY[index] + values[index] * opacity * yPerValue;

        // todo: Try other variants to draw
        ctx.fillRect(
          currentX, currentY,
          nextX - currentX, Math.round(nextY) - currentY
        );

        currentX = nextX;
        columnsCurrentY[index] = nextY;
      }
    }
  }
}
