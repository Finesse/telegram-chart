export function roundedRectanglePath(ctx, x, y, width, height, borderRadius) {
  let topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius;

  if (borderRadius instanceof Array) {
    [topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius] = borderRadius;
  } else {
    topLeftRadius = topRightRadius = bottomRightRadius = bottomLeftRadius = borderRadius;
  }

  ctx.moveTo(x, y + height - bottomLeftRadius);
  ctx.arcTo(x, y, x + topLeftRadius, y, topLeftRadius);
  ctx.arcTo(x + width, y, x + width, y + topRightRadius, topRightRadius);
  ctx.arcTo(x + width, y + height, x + width - bottomRightRadius, y + height, bottomRightRadius);
  ctx.arcTo(x, y + height, x, y + height - bottomLeftRadius, bottomLeftRadius);
}
