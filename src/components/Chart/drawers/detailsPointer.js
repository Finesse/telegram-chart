import * as PIXI from '../../../pixi';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import interpolateLinear from "../../../helpers/interpolateLinear";

const lineColor = 0x5b7589;
const lineOpacity = 0.19;
const lineWidth = 2;
const pointRadius = 5;
const pointBorderWidth = 2;
const pointBackgroundColor = 0xffffff;

export default function makeDetailsPointer(linesData) {
  const graphics = new PIXI.Graphics();

  return {
    stageChild: graphics,
    update: memoizeObjectArguments(({
      fromX,
      toX,
      fromY,
      toY,
      fromIndex,
      toIndex,
      fromValue,
      toValue,
      index,
      opacity = 1
    }, linesOpacity) => {
      graphics.clear();

      if (opacity <= 0 || fromIndex === toIndex) {
        return;
      }

      const x = Math.round(fromX + (index - fromIndex) / (toIndex - fromIndex) * (toX - fromX));
      const yPerValue = (toY - fromY) / (toValue - fromValue);

      // Draw the line
      graphics.lineStyle(lineWidth, lineColor, lineOpacity * opacity, 0.5);
      graphics.moveTo(x, fromY);
      graphics.lineTo(x, toY);

      // Draw the circles
      if (isFinite(yPerValue)) {
        for (const [key, {color, values}] of Object.entries(linesData)) {
          const dataLineOpacity = linesOpacity[key] * opacity;
          if (dataLineOpacity <= 0) {
            continue;
          }

          const value = interpolateLinear(values, index);
          const y = fromY + (value - fromValue) * yPerValue;
          const scale = 0.3 + opacity * 0.7;

          graphics.lineStyle(pointBorderWidth, PIXI.hexToColor(color), dataLineOpacity, 1);
          graphics.beginFill(pointBackgroundColor, dataLineOpacity);
          graphics.drawCircle(x, y, pointRadius * scale);
          graphics.endFill();
        }
      }
    })
  };
}
