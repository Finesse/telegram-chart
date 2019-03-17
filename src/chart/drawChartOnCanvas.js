import {chartMapHeight} from '../style';

export default function drawChartOnCanvas(canvas, drawData) {
  const {pixelRatio} = drawData;

  const ctx = canvas.getContext('2d');

  // Set the pixel ratio scale once for all the canvas methods
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const canvasWidth = canvas.width / pixelRatio;
  const canvasHeight = canvas.height / pixelRatio;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawMap(ctx, 0, canvasHeight - chartMapHeight, canvasWidth, chartMapHeight, drawData);
}

function drawMap(ctx, drawX, drawY, drawWidth, drawHeight, drawData) {
  const yRange = (drawData.maxY - drawData.minY) || 1;
  const minY = drawData.minY - yRange * 0.03;
  const maxY = drawData.maxY + yRange * 0.03;

  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const {opacity, color, values} of Object.values(drawData.lines)) {
    if (opacity <= 0) {
      continue;
    }

    ctx.strokeStyle = color; // todo: Consider opacity
    ctx.beginPath();

    for (let i = 0; i < values.length; ++i) {
      const x = drawX + i / (values.length - 1) * drawWidth;
      const y = drawY + drawHeight - (values[i] - minY) / (maxY - minY) * drawHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.closePath();
  }
}

/**
 * Round the canvas position such way that it is precisely on a pixels edge
 */
function roundPosition(position, pixelRatio = 1) {
  return Math.round(position * pixelRatio) / pixelRatio;
}

/**
 * Round the canvas stroke position such way that its edges are precisely on pixels edges
 */
function roundStrokePosition(position, width, pixelRatio = 1) {
  return roundPosition(position - width / 2, pixelRatio) + width / 2;
}
