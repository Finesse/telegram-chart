import {watchMouseDrag, watchTouchDrag} from '../../helpers/gesture';
import {isInRectangle} from '../../helpers/geometry';
import {chartSelectorGripWidth} from '../../style';

const gripOutsideOffset = 30;
const gripInsideOffset = Math.max(chartSelectorGripWidth, 15);

/**
 * Watches for different gestures on the chart map
 */
export default function watchMapGestures(element, chartState, callbacks) {
  let startMapSelectorDrag = null;
  let middleMapSelectorDrag = null;
  let endMapSelectorDrag = null;

  chartState = Object.assign({}, chartState);

  element.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('touchstart', handleTouchStart, {passive: false});

  return {
    setChartState(newState) {
      Object.assign(chartState, newState);
    },
    destroy() {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('touchstart', handleTouchStart);

      for (const watcher of [startMapSelectorDrag, middleMapSelectorDrag, endMapSelectorDrag]) {
        if (watcher) {
          watcher.destroy();
        }
      }
    }
  };

  function handleMouseDown(event) {
    event.preventDefault();
    const [x, y] = getEventRelativeCoordinates(event);

    if (isInMapSelectionStart(x, y)) {
      handleMapStartDrag(x, watchMouseDrag);
    } else if (isInMapSelectionEnd(x, y)) {
      handleMapEndDrag(x, watchMouseDrag);
    } else if (isInMapSelectionMiddle(x, y)) {
      handleMapMiddleDrag(x, watchMouseDrag);
    }
  }

  function handleTouchStart(event) {
    for (const touch of event.changedTouches) {
      const [x, y] = getEventRelativeCoordinates(touch);

      if (isInMapSelectionStart(x, y)) {
        handleMapStartDrag(x, ({onMove, onEnd}) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      } else if (isInMapSelectionEnd(x, y)) {
        handleMapEndDrag(x, ({onMove, onEnd}) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      } else if (isInMapSelectionMiddle(x, y)) {
        handleMapMiddleDrag(x, ({onMove, onEnd}) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      }
    }
  }

  /**
   * @returns {number[]} width and height
   */
  function getMapSize() {
    return [
      element.clientWidth,
      element.clientHeight
    ];
  }

  /**
   * @param {MouseEvent|Touch} event
   * @returns {number[]} X and Y
   */
  function getEventRelativeCoordinates(event) {
    const [width, height] = getMapSize();
    const bounds = element.getBoundingClientRect();

    return [
      (event.clientX - bounds.left) / bounds.width * width,
      (event.clientY - bounds.top) / bounds.height * height
    ];
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionStart(targetX, targetY) {
    const [width, height] = getMapSize();

    return isInRectangle(
      targetX, targetY,
      width * chartState.selectorStart - gripOutsideOffset, 0,
      gripInsideOffset + gripOutsideOffset, height
    );
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionEnd(targetX, targetY) {
    const [width, height] = getMapSize();

    return isInRectangle(
      targetX, targetY,
      width * chartState.selectorEnd - gripInsideOffset, 0,
      gripInsideOffset + gripOutsideOffset, height
    );
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionMiddle(targetX, targetY) {
    const [width, height] = getMapSize();

    return isInRectangle(
      targetX, targetY,
      width * chartState.selectorStart, 0,
      width * (chartState.selectorEnd - chartState.selectorStart), height
    );
  }

  /**
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  function handleMapStartDrag(x, createWatcher) {
    if (startMapSelectorDrag !== null) {
      return;
    }

    const [width] = getMapSize();
    const xOffset = x - chartState.selectorStart * width;

    startMapSelectorDrag = createWatcher({
      onMove: event => {
        const [x] = getEventRelativeCoordinates(event);
        const [width] = getMapSize();
        callbacks.selectorStart((x - xOffset) / (width || 1))
      },
      onEnd: () => startMapSelectorDrag = null
    });
  }

  /**
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  function handleMapMiddleDrag(x, createWatcher) {
    if (middleMapSelectorDrag !== null) {
      return;
    }

    const [width] = getMapSize();
    const xOffset = x - (chartState.selectorStart + chartState.selectorEnd) / 2 * width;

    middleMapSelectorDrag = createWatcher({
      onMove: event => {
        const [x] = getEventRelativeCoordinates(event);
        const [width] = getMapSize();
        callbacks.selectorMiddle((x - xOffset) / (width || 1))
      },
      onEnd: () => middleMapSelectorDrag = null
    });
  }

  /**
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  function handleMapEndDrag(x, createWatcher) {
    if (endMapSelectorDrag !== null) {
      return;
    }

    const [width] = getMapSize();
    const xOffset = x - chartState.selectorEnd * width;

    endMapSelectorDrag = createWatcher({
      onMove: event => {
        const [x] = getEventRelativeCoordinates(event);
        const [width] = getMapSize();
        callbacks.selectorEnd((x - xOffset) / (width || 1))
      },
      onEnd: () => endMapSelectorDrag = null
    });
  }
}
