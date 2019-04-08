import {modulo} from '../../../helpers/number';
import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {
  fontFamily,
  chartScalePrimaryLineColors,
  chartScalePrimaryLineOpacities,
  chartScaleSecondaryLineColors,
  chartScaleSecondaryLineOpacities,
  chartScaleLineWidth,
  chartScaleLabelColors,
  chartScaleLabelFontSize,
  chartValueScaleLabelMargin
} from '../../../style';
import {mixNumbers} from '../../../helpers/number';

/**
 * `notchScale` determines the distance between the notches measured in the value units.
 * 0 is 1, 1 is 2, 2 is 5, 3 is 10, 4 is 20, 5 is 50 and so on.
 * It can also be not integer, in this case a transitional state is rendered.
 *
 * @todo Print the numbers with suffixes
 */
export default function drawValueScale({
  ctx,
  x, y, width, height,
  fromValue, toValue,
  notchScale,
  pixelRatio,
  theme = 0
}) {
  const lineWidth = chartScaleLineWidth * pixelRatio;
  const labelOffset = chartValueScaleLabelMargin * pixelRatio;
  const primaryLineColor = mixNumberColors(chartScalePrimaryLineColors[0], chartScalePrimaryLineColors[1], theme);
  const primaryLineOpacity = mixNumbers(chartScalePrimaryLineOpacities[0], chartScalePrimaryLineOpacities[1], theme);
  const secondaryLineColor = mixNumberColors(chartScaleSecondaryLineColors[0], chartScaleSecondaryLineColors[1], theme);
  const secondaryLineOpacity = mixNumbers(chartScaleSecondaryLineOpacities[0], chartScaleSecondaryLineOpacities[1], theme);
  const labelColor = mixNumberColors(chartScaleLabelColors[0], chartScaleLabelColors[1], theme);

  const {
    value1: notchValue1,
    value2: notchValue2,
    transition: notchValuesTransition
  } = getNotchValues(notchScale);
  const yPerValue = height / ((toValue - fromValue) || 1);
  const start1Notch = Math.ceil(fromValue / notchValue1) * notchValue1;
  const start2Notch = Math.ceil(fromValue / notchValue2) * notchValue2;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'butt';
  ctx.font = `${chartScaleLabelFontSize * pixelRatio}px/1 ${fontFamily}`;
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';

  let notchIndex = 0;

  // There is the 0.1 + 0.2 problem here but it is not applicable for the input data so I haven't solved it
  for (let notch1 = start1Notch, notch2 = start2Notch; notch1 < toValue || notch2 < toValue; ++notchIndex) {
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
    const lineY = Math.round(notchY - lineWidth);
    const isPrimary = value === 0;

    ctx.strokeStyle = isPrimary
      ? numberColorToRGBA(primaryLineColor, primaryLineOpacity * opacity)
      : numberColorToRGBA(secondaryLineColor, secondaryLineOpacity * opacity);
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + width, lineY);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = numberColorToRGBA(labelColor, opacity);
    ctx.fillText(value, x, lineY - labelOffset);
  }
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
