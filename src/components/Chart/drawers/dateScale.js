import * as PIXI from '../../../pixi';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {fontFamily} from '../../../style';
import {formatDate} from '../../../helpers/date';

const notchScaleBase = 2;
const approximateLabelMaxWidth = 40;

/**
 * `notchScale` determines the number of date items between to labels. 0 is 1, 1 is 2, 2 is 4, 3 is 8 and so on.
 * It can also be not integer, in this case a transitional state is rendered.
 *
 * @todo Prerender the text labels
 */
export default function makeDateScale(dates) {
  const textContainer = new PIXI.Container();
  const labelStyle = new PIXI.TextStyle({
    fontFamily,
    fontSize: 10,
    fill: 0x96a2aa
  });

  const texts = [];

  const hideTexts = startIndex => {
    for (let i = startIndex; i < texts.length; ++i) {
      texts[i].visible = false;
    }
  };

  const getOrCreateText = index => {
    if (texts[index]) {
      texts[index].visible = true;
    } else {
      texts[index] = new PIXI.Text('', labelStyle);
      texts[index].anchor.set(0.5, 0);
      textContainer.addChild(texts[index]);
    }
    return texts[index];
  };

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
      maxNotchCount = 100 // todo: Reach this goal using the maximum distance in the transition
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

          const text = getOrCreateText(textIndex);
          text.x = x;
          text.y = y;
          text.alpha = opacity;
          text.text = formatDate(dates[index]);
          textIndex++;

          if (textIndex >= maxNotchCount) {
            break;
          }
        }
      }

      hideTexts(textIndex);
    })
  };
}
