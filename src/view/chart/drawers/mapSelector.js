import {mixNumberColors, mixNumberColorsAndOpacitiesToRGBA, numberColorToRGBA} from '../../../helpers/color';
import {
  chartMapCornersRadius,
  chartSelectorBorderCornerRadius,
  chartSelectorOutsideColors,
  chartSelectorOutsideOpacities,
  chartSelectorBorderColors,
  chartSelectorNotchColor,
  chartSelectorGripWidth,
  chartSelectorVerticalPadding,
  chartSelectorNotchWidth,
  chartSelectorNotchHeight,
  chartSelectorNotchCornerRadius
} from '../../../style';
import {roundedRectanglePath} from '../../../helpers/canvas';

export default function drawMapSelector({
  ctx,
  x, y, width, height,
  from, to,
  pixelRatio,
  theme
}) {
  const sideBorderWidth = chartSelectorGripWidth * pixelRatio;
  const outsideCornerRadius = chartMapCornersRadius * pixelRatio;
  const verticalPadding = chartSelectorVerticalPadding * pixelRatio;

  let leftOffset = Math.round(from * width);
  let rightOffset = Math.round(to * width);
  if (rightOffset - leftOffset < sideBorderWidth * 2) {
    const middleOffset = Math.round((leftOffset + rightOffset) / 2);
    leftOffset = middleOffset - sideBorderWidth;
    rightOffset = middleOffset + sideBorderWidth;
  }

  const outsideColor = mixNumberColorsAndOpacitiesToRGBA(
    chartSelectorOutsideColors[0], chartSelectorOutsideOpacities[0],
    chartSelectorOutsideColors[1], chartSelectorOutsideOpacities[1],
    theme
  );
  const borderColor = numberColorToRGBA(mixNumberColors(
    chartSelectorBorderColors[0],
    chartSelectorBorderColors[1],
    theme
  ), 1);
  const notchColor = numberColorToRGBA(chartSelectorNotchColor);

  ctx.beginPath();
  ctx.fillStyle = outsideColor;
  roundedRectanglePath(ctx, x, y, width, height, outsideCornerRadius);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = borderColor;
  roundedRectanglePath(
    ctx,
    x + leftOffset, y + verticalPadding,
    rightOffset - leftOffset, height - verticalPadding * 2,
    chartSelectorBorderCornerRadius * pixelRatio
  );
  ctx.fill();

  drawNotch(ctx, x + leftOffset + sideBorderWidth / 2, y + height / 2, notchColor, pixelRatio);
  drawNotch(ctx, x + rightOffset - sideBorderWidth / 2, y + height / 2, notchColor, pixelRatio);

  ctx.clearRect(
    x + leftOffset + sideBorderWidth, y,
    rightOffset - leftOffset - sideBorderWidth * 2, height
  );
}

function drawNotch(ctx, centerX, centerY, cssColor, pixelRatio) {
  const width = chartSelectorNotchWidth * pixelRatio;
  const height = chartSelectorNotchHeight * pixelRatio;
  const radius = chartSelectorNotchCornerRadius * pixelRatio;

  ctx.beginPath();
  ctx.fillStyle = cssColor;
  roundedRectanglePath(ctx, centerX - width / 2, centerY - height / 2, width, height, radius);
  ctx.fill();
}
