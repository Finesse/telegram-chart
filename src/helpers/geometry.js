export function isInRectangle(targetX, targetY, rectX, rectY, rectWidth, rectHeight) {
  return targetX >= rectX && targetX < rectX + rectWidth
    && targetY >= rectY && targetY < rectY + rectHeight;
}
