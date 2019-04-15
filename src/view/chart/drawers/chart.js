import memoizeOne from 'memoize-one';
import {
  chartMainLinesBottomMargin,
  chartMapHeight,
  chartMapBottom,
  chartMainTopMargin,
  chartSidePadding
} from '../../../style';
import {TYPE_AREA} from '../../../namespace';
import makeChartTop from './chartTop';
import makeChartMainWithoutX from './chartMainWithoutX';
import makeChartX from './chartX';
import makeChartMap from './chartMap';
import {makePercentageAreaCache} from './percentageArea';
import makeColumnDetails from './columnDetails';

export default function makeChart(mainCanvas, mapCanvas, type, linesData, dates, minIndex, maxIndex) {
  const mainCtx = mainCanvas.getContext('2d');
  const mapCtx = mapCanvas.getContext('2d');
  const percentageAreaCache = type === TYPE_AREA ? makePercentageAreaCache(linesData) : () => [];

  const updateMainCanvasSize = memoizeOne((width, height) => {
    mainCanvas.width = width;
    mainCanvas.height = height;
  });

  const updateMapCanvasSize = memoizeOne((width, height) => {
    mapCanvas.width = width;
    mapCanvas.height = height;
  });

  // The parts of the chart that can be updated independently
  const drawChartTop = makeChartTop(mainCtx);
  const drawChartMainWithoutX = makeChartMainWithoutX(mainCtx, type, linesData, percentageAreaCache);
  const drawChartX = makeChartX(mainCtx, dates, minIndex, maxIndex);
  const drawColumnDetails = makeColumnDetails(mainCtx, type, linesData);
  const drawChartMap = makeChartMap(mapCtx, type, linesData, minIndex, maxIndex, percentageAreaCache);

  let forceRedrawMainCanvas = 0;

  return ({
    mainCanvasWidth,
    mainCanvasHeight,
    mapCanvasWidth,
    mapCanvasHeight,
    pixelRatio = 1,
    mapMinValue,
    mapMaxValue,
    mapAltMinValue,
    mapAltMaxValue,
    mainMinValue,
    mainMaxValue,
    mainValueNotchScale,
    mainAltMinValue,
    mainAltMaxValue,
    mainAltValueNotchScale,
    dateNotchScale,
    startIndex,
    endIndex,
    detailsIndex,
    detailsDay,
    detailsMonth,
    detailsYear,
    detailsOpacity,
    rangeStartDay,
    rangeStartMonth,
    rangeStartYear,
    rangeEndDay,
    rangeEndMonth,
    rangeEndYear,
    theme // Goes from 0 (day) to 1 (night)
  }, linesOpacity) => {
    const mainSectionY = chartMainTopMargin * pixelRatio;
    const mainSectionHeight = mainCanvasHeight - (chartMainLinesBottomMargin + chartMapHeight + chartMapBottom) * pixelRatio - mainSectionY;
    const doDrawDetailsPopup = detailsOpacity > 0 && detailsIndex !== null;

    updateMainCanvasSize(mainCanvasWidth, mainCanvasHeight);
    updateMapCanvasSize(mapCanvasWidth, mapCanvasHeight);

    if (doDrawDetailsPopup) {
      mainCtx.clearRect(0, 0, mainCanvasWidth, mainCanvasHeight);
      forceRedrawMainCanvas++;
    } else {
      forceRedrawMainCanvas = 0;
    }

    drawChartTop({
      x: 0,
      y: 0,
      width: mainCanvasWidth,
      height: mainSectionY,
      rightMargin: chartSidePadding * pixelRatio,
      startDay: rangeStartDay,
      startMonth: rangeStartMonth,
      startYear: rangeStartYear,
      endDay: rangeEndDay,
      endMonth: rangeEndMonth,
      endYear: rangeEndYear,
      pixelRatio,
      theme,
      _: forceRedrawMainCanvas // Not used inside the function. Used to reset the memoization of the function
    });

    drawChartMainWithoutX({
      x: 0,
      y: mainSectionY,
      width: mainCanvasWidth,
      height: mainSectionHeight,
      minValue: mainMinValue,
      maxValue: mainMaxValue,
      valueNotchScale: mainValueNotchScale,
      altMinValue: mainAltMinValue,
      altMaxValue: mainAltMaxValue,
      altValueNotchScale: mainAltValueNotchScale,
      startIndex,
      endIndex,
      detailsIndex,
      detailsOpacity,
      pixelRatio,
      theme,
      _: forceRedrawMainCanvas
    }, linesOpacity);

    drawChartX({
      x: 0,
      y: mainSectionY + mainSectionHeight,
      width: mainCanvasWidth,
      height: mainCanvasHeight - mainSectionY - mainSectionHeight,
      startIndex,
      endIndex,
      dateNotchScale,
      pixelRatio,
      theme,
      _: forceRedrawMainCanvas
    });

    if (doDrawDetailsPopup) {
      // todo: Detect the position
      drawColumnDetails({
        x: 10 * pixelRatio,
        y: 50 * pixelRatio,
        ctx: mainCtx,
        pixelRatio,
        theme,
        type,
        linesData,
        linesOpacity,
        index: detailsIndex,
        day: detailsDay,
        month: detailsMonth,
        year: detailsYear,
        opacity: detailsOpacity
      });
    }

    drawChartMap({
      canvasWidth: mapCanvasWidth,
      canvasHeight: mapCanvasHeight,
      minValue: mapMinValue,
      maxValue: mapMaxValue,
      altMinValue: mapAltMinValue,
      altMaxValue: mapAltMaxValue,
      pixelRatio
    }, linesOpacity);
  };
}
