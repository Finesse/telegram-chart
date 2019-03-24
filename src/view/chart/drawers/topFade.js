import * as PIXI from '../../../pixi';
import ColorizeFilter from '../../../pixi/ColorizeFilter';
import memoizeObjectArguments from '../../../helpers/memoizeObjectArguments';
import {mixNumberColors} from '../../../helpers/color';

const colors = [0xffffff, 0x242f3e]; // Day and night themes

export default function makeTopFade(quality = 50) {
  const gradientTexture = makeGradientTexture(quality);
  const colorFilter = new ColorizeFilter();
  const sprite = new PIXI.Sprite(gradientTexture);
  sprite.filters = [colorFilter];

  return {
    stageChild: sprite,
    update: memoizeObjectArguments(({x, y, width, height, theme = 0, pixelRatio = 1}) => {
      const color = mixNumberColors(colors[0], colors[1], theme);
      colorFilter.setColor(color);
      colorFilter.resolution = pixelRatio;

      sprite.x = x;
      sprite.y = y;
      sprite.width = width;
      sprite.height = height;

      // The WebGL render is not synchronous with CSS transitions which cause a flicker. This hack reduces it.
      sprite.visible = theme % 1 === 0;
    })
  };
}

function makeGradientTexture(quality) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = quality;
  var ctx = canvas.getContext('2d');

  var gradient = ctx.createLinearGradient(0, 0, 0, quality);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, quality);

  return PIXI.Texture.from(canvas);
}
