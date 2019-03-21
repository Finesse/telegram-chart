import {chartSidePadding, chartMapHeight, chartMainLinesTopMargin, chartMainLinesBottomMargin} from '../../../style';
import makeMapLines from './mapLines';
import makeMapSelector from './mapSelector';
import makeMainLines from './mainLines';
import makeValueScale from './valueScale';

export default function makeChart(linesData, dates) {
  const mapLines = makeMapLines(linesData);
  const mapSelector = makeMapSelector();
  const mainLines = makeMainLines(linesData);
  const valueScale = makeValueScale(linesData);

  const datesLength = dates.length - 1;

  return {
    stageChildren: [
      ...mapLines.stageChildren,
      ...mapSelector.stageChildren,
      ...mainLines.stageChildren,
      ...valueScale.stageChildren
    ],
    update({
      canvasWidth,
      canvasHeight,
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      startIndex,
      endIndex
    }, linesOpacity) {
      mapLines.update({
        canvasWidth,
        x: chartSidePadding,
        y: canvasHeight - chartMapHeight,
        width: canvasWidth - chartSidePadding * 2,
        height: chartMapHeight,
        maxValue: mapMaxValue
      }, linesOpacity);

      mapSelector.update({
        x: chartSidePadding,
        y: canvasHeight - chartMapHeight,
        width: canvasWidth - chartSidePadding * 2,
        height: chartMapHeight,
        relativeStart: startIndex / datesLength,
        relativeEnd: endIndex / datesLength
      });

      mainLines.update({
        canvasWidth,
        x: chartSidePadding,
        y: chartMainLinesTopMargin,
        width: canvasWidth - chartSidePadding * 2,
        height: canvasHeight - chartMainLinesTopMargin - chartMainLinesBottomMargin - chartMapHeight,
        maxValue: mainMaxValue,
        fromIndex: startIndex,
        toIndex: endIndex
      }, linesOpacity);

      valueScale.update({
        x: chartSidePadding,
        y: 0,
        width: canvasWidth - chartSidePadding * 2,
        height: canvasHeight - chartMainLinesBottomMargin - chartMapHeight,
        fromValue: 0,
        toValue: mainMaxValue
          * (canvasHeight - chartMainLinesBottomMargin - chartMapHeight)
          / (canvasHeight - chartMainLinesTopMargin - chartMainLinesBottomMargin - chartMapHeight),
        notchScale: mainMaxValueNotchScale
      });
    }
  }
}
