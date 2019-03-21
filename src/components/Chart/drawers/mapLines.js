import * as PIXI from '../../../pixi';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import makeLine from './line';

export default function makeMapLines(linesData) {
  const mask = new PIXI.Graphics();
  const container = new PIXI.Container();
  container.mask = mask;

  const lines = {};
  for (const [key, {values, color}] of Object.entries(linesData)) {
    const line = makeLine({values, color, width: 1});
    container.addChild(line.stageChild);
    lines[key] = line;
  }

  return {
    stageChildren: [container, mask],
    update: memoizeObjectArguments(({
      canvasWidth,
      x,
      y,
      width,
      height,
      maxValue
    }, linesOpacity) => {
      mask.clear();
      mask.beginFill(0x000000);
      mask.drawRect(x, y, width, height);

      for (const [key, line] of Object.entries(lines)) {
        line.update({
          canvasWidth,
          fromIndex: 0,
          toIndex: linesData[key].values.length - 1,
          fromX: x,
          toX: x + width,
          fromValue: 0,
          toValue: maxValue,
          fromY: y + height,
          toY: y,
          opacity: linesOpacity[key]
        });
      }
    })
  };
}
