import memoizeOne from 'memoize-one';
import * as PIXI from '../../../pixi';
import ColorizeFilter from '../../../pixi/ColorizeFilter';
import {fontFamily} from '../../../style';
import {months} from '../../../helpers/date';

/**
 * Rendering text is a hard job for hardware. The factory renders all the required characters once and then just
 * copy-pastes them to a canvas.
 */
function makeTextFactory({charWidth = 5, ...textStyle} = {}) {
  // Creating filter takes some time so 1 filter is used for all the texts
  const colorFilter = new ColorizeFilter();

  // Prerender the required digits and months
  const {getTextureForChar, setPixelRatio: setTextsPixelRatio} = prepareTextures(new PIXI.TextStyle(textStyle));

  const setPixelRatio = ratio => {
    colorFilter.resolution = ratio;
    setTextsPixelRatio(ratio);
  };

  const makeNumber = (prepareCharactersCount = 0) => {
    const {container, setColor} = createContainer(colorFilter);

    for (let i = 0; i < prepareCharactersCount; ++i) {
      container.addChild(new PIXI.Sprite(getTextureForChar('0')));
    }

    const update = memoizeOne((number, color) => {
      const string = String(number);
      let childIndex = 0;
      let positionIndex = 0;

      setColor(color);

      for (let i = 0; i < string.length; ++i) {
        const texture = getTextureForChar(string[i]);

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
    });

    return {
      stageChild: container,
      update,
      destroy() {
        container.destroy();
      }
    };
  };

  return {setPixelRatio, makeNumber};
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
    getTextureForChar(char) {
      if (char >= '0' && char <= '9' || char === '.' || char === '-') {
        return texts[char].texture;
      }
      if (char === ' ') {
        return null;
      }
      return undefined;
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

export default makeTextFactory({
  fontFamily,
  fontSize: 10,
  charWidth: 6
});
