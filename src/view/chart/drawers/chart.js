import memoizeOne from 'memoize-one';
import {chartSidePadding, chartMainLinesTopMargin, chartMainLinesBottomMargin} from '../../../style';
import makeChartMainWithoutX from './chartMainWithoutX';
import makeDateScale from './dateScale';
import makeChartMap from './chartMap';

/*
import makeMapSelector from './mapSelector';
import makeMainLines from './mainLines';
import makeValueScale from './valueScale';
import makeDateScale from './dateScale';
import makeDetailsPointer from './detailsPointer';
import makeTopFade from './topFade';
import textFactory from './textFactory';
*/

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
  const drawDateScale = makeDateScale(mainCtx, dates);
  const drawChartMap = makeChartMap(mapCtx, linesData);

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

    updateMainCanvasSize(mainCanvasWidth, mainCanvasHeight, pixelRatio);
    updateMapCanvasSize(mapCanvasWidth, mapCanvasHeight, pixelRatio);

    drawChartMainWithoutX({
      x: 0,
      y: 0,
      width: mainCanvasWidth,
      height: mainCanvasHeight - chartMainLinesBottomMargin * pixelRatio,
      minValue: fromValue,
      maxValue: mainMaxValue,
      maxValueNotchScale: mainMaxValueNotchScale,
      startIndex,
      endIndex,
      pixelRatio,
      theme
    }, linesOpacity);

    drawDateScale({
      x: 0,
      y: mainCanvasHeight - chartMainLinesBottomMargin * pixelRatio,
      width: mainCanvasWidth,
      height: chartMainLinesBottomMargin * pixelRatio,
      fromIndex: startIndex,
      toIndex: endIndex,
      notchScale: dateNotchScale,
      pixelRatio,
      theme
    });

    drawChartMap({
      canvasWidth: mapCanvasWidth,
      canvasHeight: mapCanvasHeight,
      maxValue: mapMaxValue,
      pixelRatio
    }, linesOpacity);
  };
}

function _makeChart(linesData, dates) {
  const mapLines = makeMapLines(linesData);
  const mapSelector = makeMapSelector();
  const mainLines = makeMainLines(linesData);
  const valueScale = makeValueScale(20);
  const dateScale = makeDateScale(dates);
  const topFade = makeTopFade();
  const detailsPointer = makeDetailsPointer(linesData);

  const datesLength = dates.length - 1;

  return {
    stageChildren: [
      ...mapLines.stageChildren,
      ...mapSelector.stageChildren,
      ...mainLines.stageChildren,
      ...valueScale.stageChildren,
      dateScale.stageChild,
      topFade.stageChild,
      detailsPointer.stageChild
    ],
    update({
      canvasWidth,
      canvasHeight,
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
    }, linesOpacity) {
      const mainLinesX = chartSidePadding;
      const mainLinesY = chartMainLinesTopMargin;
      const mainLinesWidth = canvasWidth - chartSidePadding * 2;
      const mainLinesHeight = canvasHeight - chartMainLinesTopMargin - chartMainLinesBottomMargin - chartMapHeight;

      const mapX = chartSidePadding;
      const mapY = canvasHeight - chartMapHeight;
      const mapWidth = canvasWidth - chartSidePadding * 2;
      const mapHeight = chartMapHeight;

      const fromValue = 0;

      textFactory.setPixelRatio(pixelRatio);

      mapLines.update({
        canvasWidth,
        x: mapX,
        y: mapY,
        width: mapWidth,
        height: mapHeight,
        maxValue: mapMaxValue / 0.95
      }, linesOpacity);

      mapSelector.update({
        x: mapX,
        y: mapY,
        width: mapWidth,
        height: mapHeight,
        relativeStart: startIndex / datesLength,
        relativeEnd: endIndex / datesLength,
        theme
      });

      mainLines.update({
        canvasWidth,
        x: mainLinesX,
        y: mainLinesY,
        width: mainLinesWidth,
        height: mainLinesHeight,
        maxValue: mainMaxValue,
        fromIndex: startIndex,
        toIndex: endIndex
      }, linesOpacity);

      valueScale.update({
        x: mainLinesX,
        y: 0,
        width: mainLinesWidth,
        height: mainLinesHeight + chartMainLinesTopMargin - 1,
        fromValue,
        toValue: mainMaxValue * (mainLinesHeight + chartMainLinesTopMargin) / mainLinesHeight,
        notchScale: mainMaxValueNotchScale,
        theme
      });

      dateScale.update({
        canvasWidth,
        y: mainLinesY + mainLinesHeight + 5,
        fromX: mainLinesX,
        toX: mainLinesX + mainLinesWidth,
        fromIndex: startIndex,
        toIndex: endIndex,
        notchScale: dateNotchScale,
        theme
      }, linesOpacity);

      topFade.update({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: 18,
        theme,
        pixelRatio
      });

      detailsPointer.update({
        fromX: mainLinesX,
        toX: mainLinesX + mainLinesWidth,
        fromY: mainLinesY + mainLinesHeight,
        toY: mainLinesY,
        fromIndex: startIndex,
        toIndex: endIndex,
        fromValue,
        toValue: mainMaxValue,
        index: detailsIndex,
        opacity: detailsOpacity,
        theme
      }, linesOpacity);
    }
  }
}
