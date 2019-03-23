import {chartMapHeight, chartSidePadding, chartMainLinesTopMargin, chartMainLinesBottomMargin} from '../../style';

export default function watchGestures(element, chartState, callbacks) {
  let startMapSelectorDrag = null;
  let middleMapSelectorDrag = null;
  let endMapSelectorDrag = null;

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

    return isInRectangle(targetX, targetY, x + width * chartState.mapSelectorStart - 30, y - 10, 40, height + 20);
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionEnd(targetX, targetY) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(targetX, targetY, x + width * chartState.mapSelectorEnd - 10, y - 10, 40, height + 20);
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionMiddle(targetX, targetY) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorStart, y - 10,
      width * (chartState.mapSelectorEnd - chartState.mapSelectorStart), height + 20
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
      y: clientHeight - chartMapHeight,
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
}

function isInRectangle(targetX, targetY, rectX, rectY, rectWidth, rectHeight) {
  return targetX >= rectX && targetX < rectX + rectWidth
    && targetY >= rectY && targetY < rectY + rectHeight;
}

/**
 * Triggers the move callback until the mouse drag is finished. Create in a mousedown event handler.
 */
function watchMouseDrag({onMove, onEnd}) {
  const handleMove = event => {
    onMove(event);
  };

  const handleEnd = event => {
    destroy();
    onEnd(event);
  };

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('mouseleave', handleEnd);

  const destroy = () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('mouseleave', handleEnd);
  };

  return {destroy};
}

/**
 * Triggers the move callback until the touch move is finished. Create in a touchstart event handler.
 */
function watchTouchDrag({startTouch, eventTarget = window, onMove, onEnd}) {
  const getTouch = event => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === startTouch.identifier) {
        return touch;
      }
    }

    return null;
  };

  const handleMove = event => {
    const touch = getTouch(event);
    if (touch) {
      onMove(touch);
    }
  };

  const handleEnd = event => {
    const touch = getTouch(event);
    if (touch) {
      destroy();
      onEnd(touch);
    }
  };

  window.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);
  window.addEventListener('touchcancel', handleEnd);

  const destroy = () => {
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);
    window.removeEventListener('touchcancel', handleEnd);
  };

  return {destroy};
}

/**
 *
 */
function watchHover({element, onMove, onEnd, checkHover = event => true}) {
  let hoverId = null;

  const eachSubEvent = (event, callback) => {
    if (event.type.startsWith('mouse')) {
      callback('mouse', event);
    } else if (event.type.startsWith('touch')) {
      for (const touch of event.changedTouches) {
        callback(`touch${touch.identifier}`, touch);
      }
    }
  };

  const handleMove = event => {
    eachSubEvent(event, (id, event) => {
      if ((hoverId === null || id === hoverId)) {
        if (checkHover(event)) {
          hoverId = id;
          onMove(event);
        } else if (hoverId !== null) {
          hoverId = null;
          onEnd(event);
        }
      }
    });
  };

  const handleEnd = event => {
    eachSubEvent(event, (id, event) => {
      if (hoverId === id) {
        hoverId = null;
        onEnd(event);
      }
    });
  };

  const moveEvents = ['mouseenter', 'mousemove', 'touchstart', 'touchmove'];
  const endEvents = ['mouseleave', 'touchend', 'touchcancel'];

  for (const name of moveEvents) {
    element.addEventListener(name, handleMove);
  }
  for (const name of endEvents) {
    element.addEventListener(name, handleEnd);
  }

  return {
    destroy() {
      for (const name of moveEvents) {
        element.removeEventListener(name, handleMove);
      }
      for (const name of endEvents) {
        element.removeEventListener(name, handleEnd);
      }
    }
  };
}
