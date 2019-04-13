import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {rectanglePath} from '../../../helpers/canvas';
import {mixNumberColors} from '../../../helpers/color';
import {getDayInMonth, months, timestampInDay} from '../../../helpers/date';
import {
  chartHeaderBaselineOffset,
  chartHeaderFontSize,
  chartHeaderFontWeight,
  textColors,
  fontFamily
} from '../../../style';
import drawRotatingDisplay from './rotatingDisplay';

/**
 * A.k.a. the range
 *
 * `startDay` and `endDay` are set in number of days since the start of the Unix era
 * `startMonth` and `endMonth` are set in number of full months since 0 AC (e.g. April 2019 is 24231)
 * `startYear` and `endYear` are just year numbers
 * The `getDateComponentsForRange` function returns date components in these formats.
 * All the date numbers may be not integer.
 */
export default function makeChartTop(ctx) {
  return memoizeObjectArguments(({
    x, y, width, height, rightMargin,
    startDay, startMonth, startYear,
    endDay, endMonth, endYear,
    pixelRatio,
    theme
  }) => {
    ctx.save();
    ctx.clearRect(x, y, width, height);
    ctx.beginPath();
    rectanglePath(ctx, x, y, width, height);
    ctx.clip();

    // todo: Decrease the header font sizes on narrow devices
    const fontSize = chartHeaderFontSize * pixelRatio;
    const spaceWidth = 4 / 13 * fontSize;
    const commonArguments = {
      ctx,
      y: y + chartHeaderBaselineOffset * pixelRatio,
      containerAlign: 'right',
      baseline: 'alphabetic',
      fontFamily,
      fontSize,
      fontWeight: chartHeaderFontWeight,
      topAlign: 1,
      bottomAlign: 1,
      color: mixNumberColors(textColors[0], textColors[1], theme)
    };
    let rightPosition = y + width - rightMargin;

    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: endYear
    });
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: endMonth,
      getItemText: getMonthText
    });
    rightPosition -= Math.max(1.39 * fontSize, drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: endDay,
      getItemText: getDayText
    }));
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: 0,
      getItemText: returnDash
    });
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: startYear
    });
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: startMonth,
      getItemText: getMonthText
    });
    drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: startDay,
      getItemText: getDayText
    });

    ctx.restore();
  });
}

function getMonthText(monthNumber) {
  return months[monthNumber % 12];
}

function getDayText(dayNumber) {
  return getDayInMonth(dayNumber * timestampInDay);
}

function returnDash() {
  return '-';
}
