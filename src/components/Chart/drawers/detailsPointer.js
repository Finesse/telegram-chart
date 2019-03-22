import * as PIXI from '../../../pixi';
import {hexToNumber} from '../../../helpers/color';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import interpolateLinear from "../../../helpers/interpolateLinear";
import {mixNumberColors} from '../../../helpers/color';
import {mixNumbers} from '../../../helpers/number';

const lineColors = [0x5b7589, 0x5e6d7d];
const lineOpacities = [0.19, 0.41];
const lineWidth = 2;
const pointRadius = 5;
const pointBorderWidth = 2;
const pointBackgroundColors = [0xffffff, 0x242f3e];

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
      opacity = 1,
      theme = 0
    }, linesOpacity) => {
      graphics.clear();

      if (opacity <= 0 || fromIndex === toIndex) {
        return;
      }

      const x = Math.round(fromX + (index - fromIndex) / (toIndex - fromIndex) * (toX - fromX));
      const yPerValue = (toY - fromY) / (toValue - fromValue);

      const lineColor = mixNumberColors(lineColors[0], lineColors[1], theme);
      const lineOpacity = mixNumbers(lineOpacities[0], lineOpacities[1], theme);
      const pointBackgroundColor = mixNumberColors(pointBackgroundColors[0], pointBackgroundColors[1], theme);

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

          graphics.lineStyle(pointBorderWidth, hexToNumber(color), dataLineOpacity, 1);
          graphics.beginFill(pointBackgroundColor, dataLineOpacity);
          graphics.drawCircle(x, y, pointRadius * scale);
          graphics.endFill();
        }
      }
    })
  };
}
