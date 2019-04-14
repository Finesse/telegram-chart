import {numberColorToRGBA} from '../../../helpers/color';
import {chartBarDimOpacity} from '../../../style';

const chartBarDimTransparency = 1 - chartBarDimOpacity;

export default function makeBars(ctx, linesData) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;
  const columnsCurrentY = new Float32Array(dataLength);
  const columnsOpacity = new Float32Array(dataLength);

  return function drawBars({
    x, y, width, height,
    linesOpacity,
    fromX, toX, fromIndex, toIndex,
    fromSum, toSum,
    topPadding = 0,
    highlightIndex = 0,
    highlightPower = 0 // From 0 to 1
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
      columnsOpacity[i] = highlightPower > 0
        ? 1 - Math.min(1, Math.abs(i - highlightIndex)) * chartBarDimTransparency * highlightPower
        : 1;
    }

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];
      const scale = linesOpacity[key];

      if (scale <= 0) {
        continue;
      }

      const {values, color} = linesData[key];
      let currentX = Math.round(fromX + (realFromIndex - 0.5 - fromIndex) * xPerIndex);
      let lastOpacity = null;

      for (let index = realFromIndex; index <= realToIndex; ++index) {
        const opacity = columnsOpacity[index];
        if (opacity !== lastOpacity) {
          ctx.fillStyle = numberColorToRGBA(color, opacity);
          lastOpacity = opacity;
        }

        const currentY = Math.round(columnsCurrentY[index]);
        const nextX = Math.round(fromX + (index + 0.5 - fromIndex) * xPerIndex);
        const nextY = columnsCurrentY[index] + values[index] * scale * yPerValue;

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
