import * as PIXI from '../../../pixi';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {modulo} from '../../../helpers/number';
import {mixNumberColors} from '../../../helpers/color';
import {mixNumbers} from '../../../helpers/number';
import {fontFamily} from '../../../style';

const primaryLineColors = [0x5b7589, 0x8391a3];
const primaryLineOpacities = [0.11, 0.15];
const secondaryLineColors = [0x5b7589, 0x8391a3];
const secondaryLineOpacities = [0.09, 0.06];
const lineWidth = 1;
const labelColors = [0x96a2aa, 0x546778];

/**
 * `notchScale` determines the distance between the notches measured in the value units.
 * 0 is 1, 1 is 2, 2 is 5, 3 is 10, 4 is 20, 5 is 50 and so on.
 * It can also be not integer, in this case a transitional state is rendered.
 *
 * @todo Prerender the text labels
 * @todo Change the text labels color using some color filter bacause changing `fill` causes the texts to redraw
 */
export default function makeValueScale() {
  const lines = new PIXI.Graphics();
  const textContainer = new PIXI.Container();
  const labelTextStyle = new PIXI.TextStyle({
    fontFamily,
    fontSize: 10
  });

  // Rendering texts is a hard job for hardware so I keep them all pre-rendered
  // It may take some memory if there is a big range on the chart but it's not an issue for the contest
  const texts = {};

  const hideAllTexts = () => {
    for (const text of Object.values(texts)) {
      text.visible = false;
    }
  };

  const getOrCreateText = textContent => {
    if (texts[textContent]) {
      texts[textContent].visible = true;
    } else {
      texts[textContent] = new PIXI.Text(textContent, labelTextStyle);
      texts[textContent].anchor.set(0, 1);
      textContainer.addChild(texts[textContent]);
    }
    return texts[textContent];
  };

  return {
    stageChildren: [lines, textContainer],
    update: memoizeObjectArguments(({x, y, width, height, fromValue, toValue, notchScale, theme = 0}) => {
      lines.clear();
      hideAllTexts();

      const {
        value1: notchValue1,
        value2: notchValue2,
        transition: notchValuesTransition
      } = getNotchValues(notchScale);
      const yPerValue = height / ((toValue - fromValue) || 1);
      const start1Notch = Math.ceil(fromValue / notchValue1) * notchValue1;
      const start2Notch = Math.ceil(fromValue / notchValue2) * notchValue2;

      const primaryLineColor = mixNumberColors(primaryLineColors[0], primaryLineColors[1], theme);
      const primaryLineOpacity = mixNumbers(primaryLineOpacities[0], primaryLineOpacities[1], theme);
      const secondaryLineColor = mixNumberColors(secondaryLineColors[0], secondaryLineColors[1], theme);
      const secondaryLineOpacity = mixNumbers(secondaryLineOpacities[0], secondaryLineOpacities[1], theme);
      labelTextStyle.fill = mixNumberColors(labelColors[0], labelColors[1], theme);

      // There is the 0.1 + 0.2 problem here but it is not applicable for the input data so I haven't solved it
      for (let notch1 = start1Notch, notch2 = start2Notch; notch1 < toValue || notch2 < toValue;) {
        let value;
        let opacity;

        if (notch1 === notch2) {
          value = notch1;
          opacity = 1;
          notch1 += notchValue1;
          notch2 += notchValue2;
        } else if (notch1 < notch2) {
          value = notch1;
          opacity = 1 - notchValuesTransition;
          notch1 += notchValue1;
        } else {
          value = notch2;
          opacity = notchValuesTransition;
          notch2 += notchValue2;
        }

        const notchY = y + height - (value - fromValue) * yPerValue;
        const alignedNotchY = Math.round(notchY + lineWidth / 2) - lineWidth / 2;
        const isPrimary = value === 0;

        lines.lineStyle(
          lineWidth,
          isPrimary ? primaryLineColor : secondaryLineColor,
          opacity * (isPrimary ? primaryLineOpacity : secondaryLineOpacity),
          0.5
        );
        lines.moveTo(x, alignedNotchY);
        lines.lineTo(x + width, alignedNotchY);

        const text = getOrCreateText(value);
        text.x = x;
        text.y = alignedNotchY - 4;
        text.alpha = opacity;
      }
    })
  };
}

function getNotchValues(scale) {
  return {
    value1: getNotchValue(Math.floor(scale)),
    value2: getNotchValue(Math.ceil(scale)),
    transition: scale % 1
  };
}

function getNotchValue(scale) {
  const scalePrimaryLevel = Math.floor(scale / 3);
  const scaleSecondaryLevel = modulo(scale, 3);
  let scaleMultiplier;

  switch (scaleSecondaryLevel) {
    case 0: scaleMultiplier = 1; break;
    case 1: scaleMultiplier = 2; break;
    case 2: scaleMultiplier = 5; break;
  }

  return (10 ** scalePrimaryLevel) * scaleMultiplier;
}
