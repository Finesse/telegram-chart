import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {formatDate} from '../../../helpers/date';
import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {
  chartDateScaleLabelMargin,
  chartScaleLabelColors,
  chartScaleLabelFontSize,
  chartSidePadding,
  fontFamily
} from '../../../style';

const notchScaleBase = 2;

/**
 * `notchScale` determines the number of date items between to labels. 0 is 1, 1 is 2, 2 is 4, 3 is 8 and so on.
 * It can also be not integer, in this case a transitional state is rendered.
 *
 * @todo Fix the hidden leftmost date
 */
export default function makeDateScale(ctx, dates) {
  return memoizeObjectArguments(({
    x, y, width, height,
    pixelRatio,
    fromIndex,
    toIndex,
    notchScale,
    theme
  }) => {
    ctx.clearRect(x, y, width, height);

    if (fromIndex === toIndex) {
      return;
    }

    ctx.font = `${chartScaleLabelFontSize * pixelRatio}px/1 ${fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    const textColor = mixNumberColors(chartScaleLabelColors[0], chartScaleLabelColors[1], theme);
    const approximateLabelMaxWidth = 40 * pixelRatio;

    notchScale = Math.max(0, notchScale);

    const notchRange = notchScaleBase ** Math.floor(notchScale);
    const secondaryNotchOpacity = 1 - (notchScale % 1);
    const yOffset = chartDateScaleLabelMargin * pixelRatio;

    const fromX = x + chartSidePadding * pixelRatio;
    const toX = x + width - chartSidePadding * pixelRatio;
    const realFromX = x - approximateLabelMaxWidth / 2;
    const realToX = x + width + approximateLabelMaxWidth / 2;
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

      ctx.fillStyle = numberColorToRGBA(textColor, opacity);
      ctx.fillText(formatDate(dates[index]), x, y + yOffset);
    }
  });
}
