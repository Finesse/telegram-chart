import {mixNumberColors, numberColorToRGBA} from '../../../helpers/color';
import {mixNumbers, formatNumberWithThousandGroups} from '../../../helpers/number';
import {roundedRectanglePath} from '../../../helpers/canvas';
import {getDayInWeekAndMonth, months, timestampInDay} from '../../../helpers/date';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {TYPE_AREA, TYPE_BAR} from '../../../namespace';
import {
  fontFamily,
  textColors,
  chartColumnDetailsWidth,
  chartColumnDetailsSidePadding,
  chartColumnDetailsCornerRadius,
  chartColumnDetailsHeaderFontSize,
  chartColumnDetailsHeaderFontWeight,
  chartColumnDetailsHeaderBaselineY,
  chartColumnDetailsFirstRowBaselineY,
  chartColumnDetailsRowHeight,
  chartColumnDetailsBottomPadding,
  chartColumnDetailsFontSize,
  chartColumnDetailsFontWeight,
  chartColumnDetailsValueFontWeight,
  chartColumnDetailsStakeWidth,
  chartColumnDetailsStakeMargin,
  chartColumnDetailsBackgroundColors,
  chartColumnDetailsShadowColors,
  chartColumnDetailsShadowOpacities,
  chartColumnDetailsShadowXOffset,
  chartColumnDetailsShadowYOffset,
  chartColumnDetailsShadowBlur,
  chartColumnDetailsTotalText
} from '../../../style';
import drawRotatingDisplay from './rotatingDisplay';

const TOTAL_ROWS_KEY = '__total__';

export default function makeColumnDetails(ctx, type, linesData) {
  const linesKeys = Object.keys(linesData);
  const hasTotalRow = doesHaveTotalRow(linesData, type);
  const hasStakes = doesHaveStakes(type);
  const getColumnsSums = hasTotalRow || hasStakes ? makeColumnsSums(linesData) : () => [];

  const linesValueTextGetters = {};
  for (let i = 0; i < linesKeys.length; ++i) {
    const key = linesKeys[i];
    linesValueTextGetters[key] = index => {
      return formatNumberWithThousandGroups(linesData[key].values[index]);
    };
  }

  /**
   * `day` are set in number of days since the start of the Unix era
   * `month` are set in number of full months since 0 AC (e.g. April 2019 is 24231)
   * `year` are just year numbers
   * The `getDateComponentsForRange` function returns date components in these formats.
   * All the date numbers may be not integer.
   */
  return function drawColumnDetails({
    pixelRatio, theme,
    linesOpacity,
    index, opacity,
    day, month, year,
    x, y
  }) {
    if (opacity === 0) {
      return;
    }

    const width = chartColumnDetailsWidth * pixelRatio;
    const height = (
      chartColumnDetailsFirstRowBaselineY +
      (getLineRowsAmount(linesData, linesOpacity) - 1 + (hasTotalRow ? 1 : 0)) * chartColumnDetailsRowHeight +
      chartColumnDetailsBottomPadding
    ) * pixelRatio;
    const sidePadding = chartColumnDetailsSidePadding * pixelRatio;
    const backgroundColor = mixNumberColors(chartColumnDetailsBackgroundColors[0], chartColumnDetailsBackgroundColors[1], theme);
    const textColor = mixNumberColors(textColors[0], textColors[1], theme);
    const shadowColor = mixNumberColors(chartColumnDetailsShadowColors[0], chartColumnDetailsShadowColors[1], theme);
    const shadowOpacity = mixNumbers(chartColumnDetailsShadowOpacities[0], chartColumnDetailsShadowOpacities[1], theme);

    drawBackground(pixelRatio, backgroundColor, shadowColor, shadowOpacity, opacity, x, y, width, height);
    drawHeader(pixelRatio, textColor, day, month, year, opacity, x + sidePadding, y + chartColumnDetailsHeaderBaselineY * pixelRatio);

    let rowY = y + chartColumnDetailsFirstRowBaselineY * pixelRatio;
    for (let i = 0; i < linesKeys.length; ++i) {
      const key = linesKeys[i];
      const rowOpacity = linesOpacity[key];

      if (rowOpacity > 0) {
        drawRow(
          key, index, x + sidePadding, rowY, width - sidePadding * 2,
          textColor, opacity * rowOpacity, pixelRatio,
          linesOpacity
        );
        rowY += chartColumnDetailsRowHeight * pixelRatio * rowOpacity;
      }
    }
    if (hasTotalRow) {
      drawRow(
        TOTAL_ROWS_KEY, index, x + sidePadding, rowY, width - sidePadding * 2,
        textColor, opacity, pixelRatio,
        linesOpacity
      );
    }
  };

  function drawBackground(pixelRatio, backgroundColor, shadowColor, shadowOpacity, opacity, x, y, width, height) {
    // It's much faster than drawing the real shadow
    if (shadowOpacity > 0) {
      const quality = 1; // The less the better and slower. There is no sense in making it higher that the pixelRatio value.
      const stepsCount = chartColumnDetailsShadowBlur / quality;
      const stepOpacity = 1 - (1 - shadowOpacity * opacity / 2) ** (1 / stepsCount);

      ctx.fillStyle = numberColorToRGBA(shadowColor, stepOpacity);

      for (let i = 0; i < stepsCount; ++i) {
        const stepOffset = (i + 1) / stepsCount * chartColumnDetailsShadowBlur * pixelRatio;

        ctx.beginPath();
        roundedRectanglePath(
          ctx,
          x - stepOffset + chartColumnDetailsShadowXOffset * pixelRatio,
          y - stepOffset + chartColumnDetailsShadowYOffset * pixelRatio,
          width + stepOffset * 2,
          height + stepOffset * 2,
          stepOffset + chartColumnDetailsCornerRadius * pixelRatio
        );
        ctx.fill();
      }
    }

    ctx.fillStyle = numberColorToRGBA(backgroundColor, opacity);
    ctx.beginPath();
    roundedRectanglePath(ctx, x, y, width, height, chartColumnDetailsCornerRadius * pixelRatio);
    ctx.fill();
  }

  function drawHeader(pixelRatio, textColor, day, month, year, opacity, x, y) {
    const fontSize = chartColumnDetailsHeaderFontSize * pixelRatio;
    const spaceWidth = 4 / 13 * fontSize;
    const commonArguments = {
      ctx,
      y,
      containerAlign: 'left',
      baseline: 'alphabetic',
      fontFamily,
      fontSize,
      fontWeight: chartColumnDetailsHeaderFontWeight,
      topAlign: 1.3,
      bottomAlign: 0.8,
      color: textColor,
      opacity
    };
    let leftPosition = x;

    leftPosition += spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: leftPosition,
      position: day,
      getItemText: getDayText,
    });
    leftPosition += spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: leftPosition,
      position: month,
      getItemText: getMonthText,
    });
    drawRotatingDisplay({
      ...commonArguments,
      x: leftPosition,
      position: year
    });
  }

  function drawRow(key, index, x, y, width, textColor, opacity, pixelRatio, linesOpacity) {
    const isTotalRow = key === TOTAL_ROWS_KEY;
    const fontSize = chartColumnDetailsFontSize * pixelRatio;
    let labelX = x;
    const commonRotatingDisplayArguments = {
      ctx,
      y,
      position: index,
      containerAlign: 'right',
      baseline: 'alphabetic',
      fontSize,
      fontWeight: chartColumnDetailsValueFontWeight,
      fontFamily,
      opacity
    };

    if (hasStakes) {
      const {columnsSums, linesInSumCount} = getColumnsSums(linesOpacity);
      const stakeWidth = chartColumnDetailsStakeWidth * pixelRatio * (linesInSumCount === 1 ? 4 / 3 : 1);
      labelX += stakeWidth + chartColumnDetailsStakeMargin * pixelRatio;

      drawRotatingDisplay({
        ...commonRotatingDisplayArguments,
        x: x + stakeWidth,
        getItemText(index) {
          // todo: Improve the algorithm so that the sum is always 100%
          const sum = columnsSums[index];
          const stake = sum === 0 ? 0 : linesData[key].values[index] / sum;
          return Math.round(stake * 100) + '%';
        },
        topAlign: 1,
        bottomAlign: 1,
        color: textColor
      });
    }

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = (chartColumnDetailsFontWeight === 'regular' ? '' : chartColumnDetailsFontWeight)
      + fontSize + 'px ' + fontFamily;
    ctx.fillStyle = numberColorToRGBA(textColor, opacity);
    ctx.fillText(
      isTotalRow ? chartColumnDetailsTotalText : linesData[key].name,
      labelX, y
    );

    drawRotatingDisplay({
      ...commonRotatingDisplayArguments,
      x: x + width,
      getItemText: isTotalRow
        ? index => formatNumberWithThousandGroups(getColumnsSums(linesOpacity).columnsSums[index])
        : linesValueTextGetters[key],
      topAlign: 0.5,
      bottomAlign: 0.5,
      color: isTotalRow ? textColor : linesData[key].color
    });
  }
}

function getLineRowsAmount(linesData, linesOpacity) {
  let amount = 0;

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      amount += linesOpacity[key];
    }
  }

  return amount;
}

function doesHaveTotalRow(linesData, type) {
  return type === TYPE_BAR && Object.keys(linesData).length > 1;
}

function doesHaveStakes(type) {
  return type === TYPE_AREA;
}

function getDayText(dayNumber) {
  return getDayInWeekAndMonth(dayNumber * timestampInDay);
}

function getMonthText(monthNumber) {
  return months[monthNumber % 12].slice(0, 3);
}

function makeColumnsSums(linesData) {
  const linesKeys = Object.keys(linesData);
  const dataLength = linesData[linesKeys[0]].values.length;
  const columnsSums = new Float32Array(dataLength);

  return memoizeObjectArguments(linesOpacity => {
    for (let i = 0; i < dataLength; ++i) {
      columnsSums[i] = 0;
    }

    let linesInSumCount = 0;

    for (let keyI = 0; keyI < linesKeys.length; ++keyI) {
      const key = linesKeys[keyI];

      if (linesOpacity[key] > 0.5) {
        ++linesInSumCount;

        for (let i = 0; i < dataLength; ++i) {
          columnsSums[i] += linesData[key].values[i];
        }
      }
    }

    return {
      columnsSums,
      linesInSumCount
    };
  });
}
