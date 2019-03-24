import * as PIXI from '../../../pixi';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {getDateParts} from '../../../helpers/date';
import {mixNumberColors} from '../../../helpers/color';
import textFactory from './textFactory';

const notchScaleBase = 2;
const approximateLabelMaxWidth = 40;
const textColors = [0x96a2aa, 0x546778];

/**
 * `notchScale` determines the number of date items between to labels. 0 is 1, 1 is 2, 2 is 4, 3 is 8 and so on.
 * It can also be not integer, in this case a transitional state is rendered.
 */
export default function makeDateScale(dates, prepareNotchCount = 0) {
  const textContainer = new PIXI.Container();
  const textSubContainers = [];

  const printDate = (index, monthIndex, day, x = 0, y = 0, color = 0x000000, opacity = 1) => {
    if (!textSubContainers[index]) {
      textSubContainers[index] = textFactory.makeDate();
      textContainer.addChild(textSubContainers[index].stageChild);
    }

    Object.assign(textSubContainers[index].stageChild, {
      x, y,
      alpha: opacity,
      visible: true
    });
    textSubContainers[index].update(monthIndex, day, color);
  };

  const hideOtherDates = startIndex => {
    // Don't remove the containers to reduce the garbage collector load
    for (let i = startIndex; i < textSubContainers.length; ++i) {
      textSubContainers[i].stageChild.visible = false;
    }
  };

  for (let i = 0; i < prepareNotchCount; ++i) {
    printDate(i, 0, 0);
  }

  return {
    stageChild: textContainer,
    update: memoizeObjectArguments(({
      canvasWidth,
      y,
      fromX,
      toX,
      fromIndex,
      toIndex,
      notchScale = 0,
      theme = 0
    }) => {
      notchScale = Math.max(0, notchScale);
      let textIndex = 0;

      if (fromIndex !== toIndex) {
        const notchRange = notchScaleBase ** Math.floor(notchScale);
        const secondaryNotchOpacity = 1 - (notchScale % 1);

        const realFromX = -approximateLabelMaxWidth / 2;
        const realToX = canvasWidth + approximateLabelMaxWidth / 2;
        const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
        const realFromIndex = fromIndex - (xPerIndex === 0 ? 0 : (fromX - realFromX) / xPerIndex);

        const textColor = mixNumberColors(textColors[0], textColors[1], theme);

        for (
          let index = Math.max(0, Math.ceil(realFromIndex / notchRange) * notchRange);
          index < dates.length;
          index += notchRange
        ) {
          const x = fromX + (index - fromIndex) * xPerIndex;

          if (x >= realToX) {
            continue;
          }

          const isPrimary = (index / notchRange) % notchScaleBase === 0;
          const opacity = isPrimary ? 1 : secondaryNotchOpacity;

          if (opacity <= 0) {
            continue;
          }

          const {monthIndex, day} = getDateParts(dates[index]);
          printDate(textIndex, monthIndex, day, Math.round(x), y, textColor, opacity);
          textIndex++;
        }
      }

      hideOtherDates(textIndex);
    })
  };
}
