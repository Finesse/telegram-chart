import {mixNumbers, ceilWithBase, formatNumberToShortForm} from '../../../helpers/number';
import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {subDecimalScaleToNumber} from '../../../helpers/scale';
import {
  fontFamily,
  chartScaleLineColors,
  chartScaleLineOpacities,
  chartScaleLineWidth,
  chartScaleLabelColors,
  chartScaleLabelFontSize,
  chartValueScaleLabelMargin
} from '../../../style';

export default function drawValueScale({
  ctx,
  x, y, width, height,
  fromValue, toValue,
  notchScale, // See the `getSubDecimalScale` function. It can be not integer, in this case a transitional state is rendered.
  topPadding = 0,
  pixelRatio,
  theme,
  drawLines = true,
  labelColor,
  labelOpacity = 1,
  labelOnRight
}) {
  if (isNaN(fromValue) || isNaN(toValue) || !isFinite(fromValue) || !isFinite(toValue) || height === topPadding) {
    return;
  }

  if (!drawLines && labelOpacity <= 0) {
    return;
  }

  const lineWidth = chartScaleLineWidth * pixelRatio;
  const lineColor = mixNumberColors(chartScaleLineColors[0], chartScaleLineColors[1], theme);
  const lineOpacity = mixNumbers(chartScaleLineOpacities[0], chartScaleLineOpacities[1], theme);
  const fontSize = Math.round(chartScaleLabelFontSize * pixelRatio);
  const labelOffset = chartValueScaleLabelMargin * pixelRatio;
  const labelBottomExtraSpace = fontSize + labelOffset;
  const labelX = x + (labelOnRight ? width : 0);
  if (labelColor === undefined) {
    labelColor = mixNumberColors(chartScaleLabelColors[0], chartScaleLabelColors[1], theme);
  }

  const {
    value1: notchValue1,
    value2: notchValue2,
    transition: notchValuesTransition
  } = getNotchValues(notchScale);
  const yPerValue = (height - topPadding) / ((toValue - fromValue) || 1);
  const realFromValue = fromValue - labelBottomExtraSpace / yPerValue;
  const realToValue = toValue + topPadding / yPerValue;
  const start1Notch = ceilWithBase(realFromValue, notchValue1);
  const start2Notch = ceilWithBase(realFromValue, notchValue2);

  ctx.font = `${fontSize}px/1 ${fontFamily}`;
  ctx.textBaseline = 'bottom';
  ctx.textAlign = labelOnRight ? 'right' : 'left';

  if (drawLines) {
    ctx.fillStyle = numberColorToRGBA(lineColor, lineOpacity);
    ctx.fillRect(x, y + height - lineWidth, width, lineWidth);
  }

  let notchIndex = 0;

  // There is the 0.1 + 0.2 problem here but it is not applicable for the input data so I haven't solved it
  for (let notch1 = start1Notch, notch2 = start2Notch; notch1 < realToValue || notch2 < realToValue; ++notchIndex) {
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

    const notchY = Math.round(y + height - (value - fromValue) * yPerValue);

    if (drawLines && notchY < y + height) {
      ctx.fillStyle = numberColorToRGBA(lineColor, lineOpacity * opacity);
      ctx.fillRect(x, notchY - lineWidth, width, lineWidth);
    }

    if (labelOpacity > 0 && notchY > y + labelOffset) {
      ctx.fillStyle = numberColorToRGBA(labelColor, labelOpacity * opacity);
      ctx.fillText(formatNumberToShortForm(value), labelX, notchY - labelOffset);
    }
  }
}

function getNotchValues(scale) {
  return {
    value1: subDecimalScaleToNumber(Math.floor(scale)),
    value2: subDecimalScaleToNumber(Math.ceil(scale)),
    transition: scale % 1
  };
}
