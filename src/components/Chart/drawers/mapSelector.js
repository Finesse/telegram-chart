import * as PIXI from '../../../pixi';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {mixNumberColors} from '../../../helpers/color';
import {mixNumbers} from '../../../helpers/number';

const selectorHorizontalBorderWidth = 1;
const selectorVerticalBorderWidth = 4;
const outsideColors = [0xF6F8F2, 0x1e2836]; // Day and night themes
const outsideOpacities = [0.8, 0.77];
const borderColors = [0x3076A7, 0x6c90b2];
const borderOpacities = [0.16, 0.4];

export default function makeMapSelector() {
  const outsideLeft = new PIXI.Graphics();
  const outsideRight = new PIXI.Graphics();
  const borderTop = new PIXI.Graphics();
  const borderBottom = new PIXI.Graphics();
  const borderLeft = new PIXI.Graphics();
  const borderRight = new PIXI.Graphics();

  return {
    stageChildren: [outsideLeft, outsideRight, borderTop, borderBottom, borderLeft, borderRight],
    update: memoizeObjectArguments(({
      x,
      y,
      width,
      height,
      relativeStart,
      relativeEnd,
      theme = 0
    }) => {
      const middleX = Math.round(x + (relativeStart + relativeEnd) / 2 * width);
      const startX = Math.min(middleX - selectorVerticalBorderWidth, Math.round(x + relativeStart * width));
      const endX = Math.max(middleX + selectorVerticalBorderWidth, Math.round(x + relativeEnd * width));

      const outsideColor = mixNumberColors(outsideColors[0], outsideColors[1], theme);
      const outsideOpacity = mixNumbers(outsideOpacities[0], outsideOpacities[1], theme);
      const borderColor = mixNumberColors(borderColors[0], borderColors[1], theme);
      const borderOpacity = mixNumbers(borderOpacities[0], borderOpacities[1], theme);

      outsideLeft.clear();
      outsideLeft.beginFill(outsideColor, outsideOpacity);
      outsideLeft.drawRect(x, y, Math.max(0, startX - x), height);

      outsideRight.clear();
      outsideRight.beginFill(outsideColor, outsideOpacity);
      outsideRight.drawRect(endX, y, Math.max(0, x + width - endX), height);

      borderTop.clear();
      borderTop.beginFill(borderColor, borderOpacity);
      borderTop.drawRect(startX, y, Math.max(0, endX - startX), selectorHorizontalBorderWidth);

      borderBottom.clear();
      borderBottom.beginFill(borderColor, borderOpacity);
      borderBottom.drawRect(startX, y + height - selectorHorizontalBorderWidth, Math.max(0, endX - startX), selectorHorizontalBorderWidth);

      borderLeft.clear();
      borderLeft.beginFill(borderColor, borderOpacity);
      borderLeft.drawRect(startX, y + selectorHorizontalBorderWidth, selectorVerticalBorderWidth, Math.max(0, height - selectorHorizontalBorderWidth * 2));

      borderRight.clear();
      borderRight.beginFill(borderColor, borderOpacity);
      borderRight.drawRect(endX - selectorVerticalBorderWidth, y + selectorHorizontalBorderWidth, selectorVerticalBorderWidth, Math.max(0, height - selectorHorizontalBorderWidth * 2));
    })
  };
}
