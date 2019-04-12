import memoizeOne from 'memoize-one';
import {chartMainLinesBottomMargin, chartMapHeight, chartMapBottom} from '../../../style';
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
    theme // Goes from 0 (day) to 1 (night)
  }, linesOpacity) => {
    const fromValue = 0;
    const mainLinesY = mainCanvasHeight - (chartMainLinesBottomMargin + chartMapHeight + chartMapBottom) * pixelRatio;

    updateMainCanvasSize(mainCanvasWidth, mainCanvasHeight);
    updateMapCanvasSize(mapCanvasWidth, mapCanvasHeight);

    drawChartMainWithoutX({
      x: 0,
      y: 0,
      width: mainCanvasWidth,
      height: mainLinesY,
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
      y: mainLinesY,
      width: mainCanvasWidth,
      height: mainCanvasHeight - mainLinesY,
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
