import {createRef} from 'inferno';
import {PureComponent} from '../../helpers/inferno';
import {chartMapHeight, chartSidePadding, chartMainLinesTopMargin, chartMainLinesBottomMargin} from '../../style';

export default class GestureRecognizer extends PureComponent {
  blockRef = createRef();
  startMapSelectorDrag = null;
  middleMapSelectorDrag = null;
  endMapSelectorDrag = null;
  detailsHover;

  mouseDown = event => {
    event.preventDefault();
    const {x, y} = this.getEventRelativeCoordinates(event);

    if (this.isInMapSelectionStart(x, y)) {
      this.handleMapStartDrag(x, watchMouseDrag);
    } else if (this.isInMapSelectionEnd(x, y)) {
      this.handleMapEndDrag(x, watchMouseDrag);
    } else if (this.isInMapSelectionMiddle(x, y)) {
      this.handleMapMiddleDrag(x, watchMouseDrag);
    }
  };

  touchStart = event => {
    for (const touch of event.changedTouches) {
      const {x, y} = this.getEventRelativeCoordinates(touch);

      if (this.isInMapSelectionStart(x, y)) {
        this.handleMapStartDrag(x, ({onMove, onEnd}) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      } else if (this.isInMapSelectionEnd(x, y)) {
        this.handleMapEndDrag(x, ({onMove, onEnd}) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      } else if (this.isInMapSelectionMiddle(x, y)) {
        this.handleMapMiddleDrag(x, ({onMove, onEnd}) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      }
    }
  };

  /**
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  handleMapStartDrag(x, createWatcher) {
    if (this.startMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = this.getMapBounds();
    const xOffset = x - (mapX + this.props.mapSelectorStart * mapWidth);

    this.startMapSelectorDrag = createWatcher({
      onMove: event => {
        const {x} = this.getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = this.getMapBounds();
        this.props.onMapSelectorStartChange((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => this.startMapSelectorDrag = null
    });
  }

  /**
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  handleMapMiddleDrag(x, createWatcher) {
    if (this.middleMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = this.getMapBounds();
    const xOffset = x - (mapX + (this.props.mapSelectorStart + this.props.mapSelectorEnd) / 2 * mapWidth);

    this.middleMapSelectorDrag = createWatcher({
      onMove: event => {
        const {x} = this.getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = this.getMapBounds();
        this.props.onMapSelectorMiddleChange((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => this.middleMapSelectorDrag = null
    });
  }

  /**
   * @param {number} x The X position of the event start in px relative to the block
   * @param {function} createWatcher Takes `onMove` and `onEnd` functions and returns an object with a `destroy` method
   */
  handleMapEndDrag(x, createWatcher) {
    if (this.endMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = this.getMapBounds();
    const xOffset = x - (mapX + this.props.mapSelectorEnd * mapWidth);

    this.endMapSelectorDrag = createWatcher({
      onMove: event => {
        const {x} = this.getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = this.getMapBounds();
        this.props.onMapSelectorEndChange((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => this.endMapSelectorDrag = null
    });
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  isInMapSelectionStart(targetX, targetY) {
    const {x, y, width, height} = this.getMapBounds();

    return isInRectangle(targetX, targetY, x + width * this.props.mapSelectorStart - 30, y - 10, 40, height + 20);
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  isInMapSelectionEnd(targetX, targetY) {
    const {x, y, width, height} = this.getMapBounds();

    return isInRectangle(targetX, targetY, x + width * this.props.mapSelectorEnd - 10, y - 10, 40, height + 20);
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  isInMapSelectionMiddle(targetX, targetY) {
    const {x, y, width, height} = this.getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * this.props.mapSelectorStart, y - 10,
      width * (this.props.mapSelectorEnd - this.props.mapSelectorStart), height + 20
    );
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  isInMapLines(targetX, targetY) {
    const {x, y, width, height} = this.getMainLinesBounds();

    return isInRectangle(targetX, targetY, x, y, width, height);
  }

  /**
   * @param {MouseEvent|Touch} event
   * @returns {{x: number, y: number}}
   */
  getEventRelativeCoordinates(event) {
    const target = this.blockRef.current;
    const {clientWidth, clientHeight} = target;
    const bounds = target.getBoundingClientRect();

    return {
      x: (event.clientX - bounds.left) / bounds.width * clientWidth,
      y: (event.clientY - bounds.top) / bounds.height * clientHeight
    };
  }

  getMapBounds() {
    const {clientWidth, clientHeight} = this.blockRef.current;

    return {
      x: chartSidePadding,
      y: clientHeight - chartMapHeight,
      width: clientWidth - chartSidePadding * 2,
      height: chartMapHeight
    };
  }

  getMainLinesBounds() {
    const {clientWidth, clientHeight} = this.blockRef.current;

    return {
      x: chartSidePadding,
      y: chartMainLinesTopMargin,
      width: clientWidth - chartSidePadding * 2,
      height: clientHeight - chartMainLinesTopMargin - chartMainLinesBottomMargin - chartMapHeight
    };
  }

  componentDidMount() {
    // event.preventDefault() doesn't work if the event is attached through the JSX
    this.blockRef.current.addEventListener('touchstart', this.touchStart, {passive: false});

    this.detailsHover = watchHover({
      element: this.blockRef.current,
      checkHover: event => {
        const {x, y} = this.getEventRelativeCoordinates(event);
        return this.isInMapLines(x, y);
      },
      onMove: event => {
        const {x} = this.getEventRelativeCoordinates(event);
        const {x: linesX, width: linesWidth} = this.getMainLinesBounds();
        this.props.onDetailsPositionChange((x - linesX) / (linesWidth || 1))
      },
      onEnd: () => this.props.onDetailsPositionChange(null)
    });
  }

  componentWillUnmount() {
    for (const watcher of [this.startMapSelectorDrag, this.middleMapSelectorDrag, this.endMapSelectorDrag]) {
      if (watcher) {
        watcher.destroy();
      }
    }
  }

  render() {
    return (
      <div className={this.props.className} onMouseDown={this.mouseDown} ref={this.blockRef}>
        {this.props.children || null}
      </div>
    );
  }
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
