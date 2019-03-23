import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import makeLine from './line';

export default function makeMainLines(linesData) {
  const lines = {};
  for (const [key, {values, color}] of Object.entries(linesData)) {
    lines[key] = makeLine({values, color, width: 2});
  }

  return {
    stageChildren: Object.values(lines).map(line => line.stageChild),
    update: memoizeObjectArguments(({
      canvasWidth,
      x,
      y,
      width,
      height,
      maxValue,
      fromIndex,
      toIndex
    }, linesOpacity) => {
      for (const [key, line] of Object.entries(lines)) {
        line.update({
          canvasWidth,
          fromIndex,
          toIndex,
          fromX: x,
          toX: x + width,
          fromValue: 0,
          toValue: maxValue,
          fromY: y + height,
          toY: y,
          opacity: linesOpacity[key],
          smoothness: 0.05
        });
      }
    })
  };
}
