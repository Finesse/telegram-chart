import {
  chartMapHeight,
  chartSidePadding,
  chartMainLinesTopMargin,
  chartMainLinesBottomMargin,
  chartMapBottom,
  chartSelectorGripWidth,
} from '../../style';
import {watchMouseDrag, watchTouchDrag, watchHover} from '../../helpers/gesture';
import {isInRectangle} from '../../helpers/geometry';

const mapGripOutsideOffset = 30;
const mapGripInsideOffset = Math.max(chartSelectorGripWidth, 15);
const mapGripVerticalOffset = 10;

/**
 * Watches for different gestures on the chart (drag the map, hover the lines, etc.)
 */
export default function watchGestures(element, chartState, callbacks) {
  let startMapSelectorDrag = null;
  let middleMapSelectorDrag = null;
  let endMapSelectorDrag = null;

  element.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('touchstart', handleTouchStart, {passive: false});

  const detailsHoverWatcher = watchHover({
    element,
    checkHover: event => {
      const {x, y} = getEventRelativeCoordinates(event);
      return isInMapLines(x, y);
    },
    onMove: event => {
      const {x} = getEventRelativeCoordinates(event);
      const {x: linesX, width: linesWidth} = getMainLinesBounds();
      callbacks.detailsPosition((x - linesX) / (linesWidth || 1))
    },
    onEnd: () => callbacks.detailsPosition(null)
  });

  return {
    setChartState(newState) {
      chartState = {...chartState, ...newState};
    },
    destroy() {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('touchstart', handleTouchStart);

      for (const watcher of [detailsHoverWatcher, startMapSelectorDrag, middleMapSelectorDrag, endMapSelectorDrag]) {
        if (watcher) {
          watcher.destroy();
        }
      }
    }
  };

  function handleMouseDown(event) {
    event.preventDefault();
    const {x, y} = getEventRelativeCoordinates(event);

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
      const {x, y} = getEventRelativeCoordinates(touch);

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
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  function handleMapStartDrag(x, createWatcher) {
    if (startMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = getMapBounds();
    const xOffset = x - (mapX + chartState.mapSelectorStart * mapWidth);

    startMapSelectorDrag = createWatcher({
      onMove: event => {
        const {x} = getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = getMapBounds();
        callbacks.mapSelectorStart((x - xOffset - mapX) / (mapWidth || 1))
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

    const {x: mapX, width: mapWidth} = getMapBounds();
    const xOffset = x - (mapX + (chartState.mapSelectorStart + chartState.mapSelectorEnd) / 2 * mapWidth);

    middleMapSelectorDrag = createWatcher({
      onMove: event => {
        const {x} = getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = getMapBounds();
        callbacks.mapSelectorMiddle((x - xOffset - mapX) / (mapWidth || 1))
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

    const {x: mapX, width: mapWidth} = getMapBounds();
    const xOffset = x - (mapX + chartState.mapSelectorEnd * mapWidth);

    endMapSelectorDrag = createWatcher({
      onMove: event => {
        const {x} = getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = getMapBounds();
        callbacks.mapSelectorEnd((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => endMapSelectorDrag = null
    });
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionStart(targetX, targetY) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorStart - mapGripOutsideOffset, y - mapGripVerticalOffset,
      mapGripInsideOffset + mapGripOutsideOffset, height + mapGripVerticalOffset * 2
    );
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionEnd(targetX, targetY) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorEnd - mapGripInsideOffset, y - mapGripVerticalOffset,
      mapGripInsideOffset + mapGripOutsideOffset, height + mapGripVerticalOffset * 2
    );
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionMiddle(targetX, targetY) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorStart, y - mapGripVerticalOffset,
      width * (chartState.mapSelectorEnd - chartState.mapSelectorStart), height + mapGripVerticalOffset * 2
    );
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapLines(targetX, targetY) {
    const {x, y, width, height} = getMainLinesBounds();

    return isInRectangle(targetX, targetY, x, y, width, height);
  }

  /**
   * @param {MouseEvent|Touch} event
   * @returns {{x: number, y: number}}
   */
  function getEventRelativeCoordinates(event) {
    const {clientWidth, clientHeight} = element;
    const bounds = element.getBoundingClientRect();

    return {
      x: (event.clientX - bounds.left) / bounds.width * clientWidth,
      y: (event.clientY - bounds.top) / bounds.height * clientHeight
    };
  }

  function getMapBounds() {
    const {clientWidth, clientHeight} = element;

    return {
      x: chartSidePadding,
      y: clientHeight - chartMapHeight - chartMapBottom,
      width: clientWidth - chartSidePadding * 2,
      height: chartMapHeight
    };
  }

  function getMainLinesBounds() {
    const {clientWidth, clientHeight} = element;

    return {
      x: chartSidePadding,
      y: chartMainLinesTopMargin,
      width: clientWidth - chartSidePadding * 2,
      height: clientHeight - chartMainLinesTopMargin - chartMainLinesBottomMargin - chartMapHeight
    };
  }
}
