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
import makeChartMap from './chartMap';
import {makeGetColumnsSums} from './percentageArea';
import {TYPE_AREA} from "../../../namespace";

export default function makeChart(mainCanvas, mapCanvas, type, linesData, dates, minIndex, maxIndex) {
  const mainCtx = mainCanvas.getContext('2d');
  const mapCtx = mapCanvas.getContext('2d');

  const getColumnsSums = type === TYPE_AREA ? makeGetColumnsSums(linesData) : () => [];

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
  const drawChartMainWithoutX = makeChartMainWithoutX(mainCtx, type, linesData, getColumnsSums);
  const drawChartX = makeChartX(mainCtx, dates, minIndex, maxIndex);
  const drawChartMap = makeChartMap(mapCtx, type, linesData, minIndex, maxIndex, getColumnsSums);

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
      minValue: mainMinValue,
      maxValue: mainMaxValue,
      valueNotchScale: mainValueNotchScale,
      altMinValue: mainAltMinValue,
      altMaxValue: mainAltMaxValue,
      altValueNotchScale: mainAltValueNotchScale,
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
