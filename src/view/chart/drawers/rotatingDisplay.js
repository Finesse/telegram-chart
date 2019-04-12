import {numberColorToRGBA} from '../../../helpers/color';

const edgeScale = 0.5;
const edgeYRelativeOffset = 0.6;

/**
 * `position` is the current display state (it rotates while the position increases).
 *
 * Returns the width of the container
 */
export default function drawRotatingDisplay({
  ctx,
  x, y,
  position,
  getItemText = index => index,
  containerAlign = 'left', baseline = 'alphabetic',
  fontSize = 10,
  fontWeight = '',
  fontFamily = '',
  lineHeight = 1,
  topAlign = 0.5,
  bottomAlign = 0.5,
  color = 0x000000, opacity = 1
}) {
  const itemIndices = [Math.floor(position), Math.floor(position) + 1];
  let averageWidth = 0;

  const fontStringBeforeSize = fontWeight + ' ';
  const fontStringAfterSize = 'px/' + lineHeight + ' ' + fontFamily;

  ctx.textBaseline = baseline;
  ctx.textAlign = containerAlign;

  for (let i = 0; i < itemIndices.length; ++i) {
    const itemIndex = itemIndices[i];
    const distanceToCenter = Math.abs(itemIndex - position);

    if (distanceToCenter >= 1) {
      break;
    }

    // Measure the text width
    // todo: Measuring takes much time. Try to optimize it by precomputing.
    const itemText = getItemText(itemIndex);
    ctx.font = fontStringBeforeSize + Math.round(fontSize) + fontStringAfterSize;
    const itemWidth = ctx.measureText(itemText).width;
    averageWidth += itemWidth * (1 - distanceToCenter);

    const scale = 1 - distanceToCenter * (1 - edgeScale);
    const freeSpaceWidth = (1 - scale) * itemWidth;
    const align = itemIndex > position ? bottomAlign : topAlign;
    let alignShift = 0;

    switch (containerAlign) {
      case 'left':
        alignShift = align;
        break;
      case 'right':
        alignShift = align - 1;
        break;
      case 'center':
        alignShift = align - 0.5;
        break;
    }

    const itemX = x + freeSpaceWidth * alignShift;
    const itemY = y + (itemIndex - position) * fontSize * lineHeight * edgeYRelativeOffset;

    // Draw the text
    // The text is drawn MUCH faster when the font size is integer
    ctx.font = fontStringBeforeSize + Math.round(fontSize * scale) + fontStringAfterSize;
    ctx.fillStyle = numberColorToRGBA(color, opacity * (1 - distanceToCenter));
    ctx.fillText(itemText, Math.round(itemX), Math.round(itemY));
  }

  return averageWidth;
}
