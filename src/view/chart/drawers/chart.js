import memoizeOne from 'memoize-one';
import {
  chartMainLinesBottomMargin,
  chartMapHeight,
  chartMapBottom,
  chartMainTopMargin,
  chartSidePadding
} from '../../../style';
import makeChartTop from './chartTop';
import makeChartMainWithoutX from './chartMainWithoutX';
import makeChartX from './chartX';
import makeMapLines from './mapLines';

export default function makeChart(mainCanvas, mapCanvas, linesData, dates) {
  const mainCtx = mainCanvas.getContext('2d');
  const mapCtx = mapCanvas.getContext('2d');

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
  const drawChartMainWithoutX = makeChartMainWithoutX(mainCtx, linesData);
  const drawChartX = makeChartX(mainCtx, dates);
  const drawMapLines = makeMapLines(mapCtx, linesData);

  return ({
    mainCanvasWidth,
    mainCanvasHeight,
    mapCanvasWidth,
    mapCanvasHeight,
    pixelRatio = 1,
    mapMaxValue,
    mainMaxValue,
    mainMaxValueNotchScale,
    dateNotchScale,
    startIndex,
    endIndex,
    detailsIndex,
    detailsOpacity,
    rangeStartDay,
    rangeStartMonth,
    rangeStartYear,
    rangeEndDay,
    rangeEndMonth,
    rangeEndYear,
    theme // Goes from 0 (day) to 1 (night)
  }, linesOpacity) => {
    const fromValue = 0;
    const mainSectionY = chartMainTopMargin * pixelRatio;
    const mainSectionHeight = mainCanvasHeight - (chartMainLinesBottomMargin + chartMapHeight + chartMapBottom) * pixelRatio - mainSectionY;

    updateMainCanvasSize(mainCanvasWidth, mainCanvasHeight);
    updateMapCanvasSize(mapCanvasWidth, mapCanvasHeight);

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
      theme
    });

    drawChartMainWithoutX({
      x: 0,
      y: mainSectionY,
      width: mainCanvasWidth,
      height: mainSectionHeight,
      minValue: fromValue,
      maxValue: mainMaxValue,
      maxValueNotchScale: mainMaxValueNotchScale,
      startIndex,
      endIndex,
      pixelRatio,
      theme
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
      theme
    });

    drawMapLines({
      canvasWidth: mapCanvasWidth,
      canvasHeight: mapCanvasHeight,
      maxValue: mapMaxValue,
      pixelRatio
    }, linesOpacity);
  };
}
