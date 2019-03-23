import {chartSidePadding, chartMapHeight, chartMainLinesTopMargin, chartMainLinesBottomMargin} from '../../../style';
import makeMapLines from './mapLines';
import makeMapSelector from './mapSelector';
import makeMainLines from './mainLines';
import makeValueScale from './valueScale';
import makeDateScale from './dateScale';
import makeDetailsPointer from './detailsPointer';
import textFactory from './textFactory';

export default function makeChart(linesData, dates) {
  const mapLines = makeMapLines(linesData);
  const mapSelector = makeMapSelector();
  const mainLines = makeMainLines(linesData);
  const valueScale = makeValueScale(20);
  const dateScale = makeDateScale(dates);
  const detailsPointer = makeDetailsPointer(linesData);

  const datesLength = dates.length - 1;

  return {
    stageChildren: [
      ...mapLines.stageChildren,
      ...mapSelector.stageChildren,
      ...mainLines.stageChildren,
      ...valueScale.stageChildren,
      dateScale.stageChild,
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
        y: mainLinesY + mainLinesHeight + 8,
        fromX: mainLinesX,
        toX: mainLinesX + mainLinesWidth,
        fromIndex: startIndex,
        toIndex: endIndex,
        notchScale: dateNotchScale,
        theme
      }, linesOpacity);

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
