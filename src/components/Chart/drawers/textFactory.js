import memoizeOne from 'memoize-one';
import * as PIXI from '../../../pixi';
import ColorizeFilter from '../../../pixi/ColorizeFilter';
import {fontFamily} from '../../../style';
import {months} from '../../../helpers/date';

/**
 * Rendering text is a hard job for hardware. The factory renders all the required characters once and then just
 * copy-pastes them to a canvas.
 *
 * Don't forget to call `setPixelRatio`
 */
export function makeTextFactory({charWidth = 5, ...textStyle} = {}) {
  // Creating filter takes some time so 1 filter is used for all the texts
  const colorFilter = new ColorizeFilter();

  // Prerender the required digits and months
  const {
    getCharTexture,
    getMonthTexture,
    setPixelRatio: setTextsPixelRatio
  } = prepareTextures(new PIXI.TextStyle(textStyle));

  return {
    setPixelRatio(ratio) {
      colorFilter.resolution = ratio;
      setTextsPixelRatio(ratio);
    },
    makeNumber(prepareCharactersCount = 0) {
      return makeNumber(charWidth, colorFilter, getCharTexture, prepareCharactersCount);
    },
    makeDate() {
      return makeDate(charWidth, colorFilter, getCharTexture, getMonthTexture);
    },
  };
}

function prepareTextures(textStyle) {
  let pixelRatio = 1;

  const texts = {
    '.': new PIXI.Text('.', textStyle),
    '-': new PIXI.Text('-', textStyle)
  };
  for (let i = 0; i < 10; ++i) {
    texts[i] = new PIXI.Text(i, textStyle);
  }
  for (const month of months) {
    texts[month] = new PIXI.Text(month, textStyle);
  }

  return {
    getCharTexture(char) {
      if (char >= '0' && char <= '9' || char === '.' || char === '-') {
        return texts[char].texture;
      }
      if (char === ' ') {
        return null;
      }
      return undefined;
    },
    getMonthTexture(monthIndex) {
      return texts[months[monthIndex]].texture;
    },
    setPixelRatio(ratio) {
      if (ratio === pixelRatio) {
        return;
      }

      pixelRatio = ratio;

      for (const text of Object.values(texts)) {
        text.resolution = ratio;
        text.updateText(); // Makes the text texture update
      }
    }
  }
}

// Why: http://www.html5gamedevs.com/topic/20112-using-same-filter-with-different-uniform-values/
const createContainer = colorFilter => {
  let color;

  const container = new PIXI.Container();
  container.filters = [colorFilter];

  container.oldRender = container._render;
  container._render = function (...args) {
    if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
      return;
    }

    this.filters[0].setColor(color);
    this.oldRender(...args);
  };

  return {
    container,
    setColor: newColor => color = newColor
  };
};

function makeNumber(charWidth, colorFilter, getCharTexture, prepareCharactersCount = 0) {
  const {container, setColor} = createContainer(colorFilter);

  for (let i = 0; i < prepareCharactersCount; ++i) {
    container.addChild(new PIXI.Sprite(getCharTexture('0')));
  }

  return {
    stageChild: container,
    update: memoizeOne((number, color) => {
      const string = String(number);
      let childIndex = 0;
      let positionIndex = 0;

      setColor(color);

      for (let i = 0; i < string.length; ++i) {
        const texture = getCharTexture(string[i]);

        if (texture === null) {
          ++positionIndex; // A blank space
        } else if (texture === undefined) {
          // An unknown symbol
        } else {
          if (container.children[childIndex]) {
            container.children[childIndex].texture = texture;
          } else {
            container.addChild(new PIXI.Sprite(texture));
          }
          Object.assign(container.children[childIndex], {
            visible: true,
            x: positionIndex * charWidth
          });
          ++positionIndex;
          ++childIndex;
        }
      }

      // Don't remove the sprites to reduce the garbage collector load
      for (; childIndex < container.children.length; ++childIndex) {
        container.children[childIndex].visible = false;
      }
    }),
    destroy() {
      container.destroy();
    }
  };
}

function makeDate(charWidth, colorFilter, getCharTexture, getMonthTexture) {
  const {container, setColor} = createContainer(colorFilter);

  // 3 sprites: 1 for month and 1-2 for day
  const monthSprite = new PIXI.Sprite(getMonthTexture(0));
  monthSprite.anchor.set(1, 0);
  container.addChild(monthSprite);

  const daySprites = [];
  for (let i = 0; i < 2; ++i) {
    const sprite = new PIXI.Sprite(getCharTexture('0'));
    sprite.x = (i + 1) * charWidth;
    daySprites.push(sprite);
    container.addChild(sprite);
  }

  return {
    stageChild: container,
    update: memoizeOne((monthIndex, day, color) => {
      setColor(color);

      monthSprite.texture = getMonthTexture(monthIndex);

      if (day < 10) {
        daySprites[0].texture = getCharTexture(String(day));
        daySprites[1].visible = false;
      } else {
        daySprites[0].texture = getCharTexture(String(Math.floor(day / 10)));
        daySprites[1].visible = true;
        daySprites[1].texture = getCharTexture(String(day % 10));
      }
    }),
    destroy() {
      container.destroy();
    }
  };
}

export default makeTextFactory({
  fontFamily,
  fontSize: 10,
  charWidth: 6
});
