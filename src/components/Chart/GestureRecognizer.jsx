import {createRef} from 'inferno';
import {PureComponent} from '../../helpers/inferno';
import {chartMapHeight, chartSidePadding} from '../../style';

export default class GestureRecognizer extends PureComponent {
  blockRef = createRef();
  startMapSelectorDrag = null;
  middleMapSelectorDrag = null;
  endMapSelectorDrag = null;

  get element() {
    return this.blockRef.current;
  }

  mouseDown = event => {
    event.preventDefault();
    const {x, y} = this.getEventRelativeCoordinates(event);

    switch (this.getTargetUnderPointer(x, y)) {
      case 'mapStart':
        this.handleMapStartDrag(x, watchMouseDrag);
        break;
      case 'mapMiddle':
        this.handleMapMiddleDrag(x, watchMouseDrag);
        break;
      case 'mapEnd':
        this.handleMapEndDrag(x, watchMouseDrag);
        break;
    }
  };

  touchStart = event => {
    for (const touch of event.changedTouches) {
      const {x, y} = this.getEventRelativeCoordinates(touch);

      switch (this.getTargetUnderPointer(x, y)) {
        case 'mapStart':
          this.handleMapStartDrag(x, ({onMove, onEnd}) => {
            event.preventDefault();
            return watchTouchDrag({startTouch: touch, onMove, onEnd});
          });
          break;
        case 'mapMiddle':
          this.handleMapMiddleDrag(x, ({onMove, onEnd}) => {
            event.preventDefault();
            return watchTouchDrag({startTouch: touch, onMove, onEnd});
          });
          break;
        case 'mapEnd':
          this.handleMapEndDrag(x, ({onMove, onEnd}) => {
            event.preventDefault();
            return watchTouchDrag({startTouch: touch, onMove, onEnd});
          });
          break;
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
  getTargetUnderPointer(x, y) {
    const {
      x: mapX,
      y: mapY,
      width: mapWidth,
      height: mapHeight
    } = this.getMapBounds();

    // The map selection start point
    if (isInRectangle(x, y, mapX + mapWidth * this.props.mapSelectorStart - 30, mapY - 10, 40, mapHeight + 20)) {
      return 'mapStart';
    }

    // The map selection end point
    if (isInRectangle(x, y, mapX + mapWidth * this.props.mapSelectorEnd - 10, mapY - 10, 40, mapHeight + 20)) {
      return 'mapEnd';
    }

    // The middle of the map selection
    if (isInRectangle(
      x, y,
      mapX + mapWidth * this.props.mapSelectorStart, mapY - 10,
      mapWidth * (this.props.mapSelectorEnd - this.props.mapSelectorStart), mapHeight + 20
    )) {
      return 'mapMiddle';
    }
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

  componentDidMount() {
    // event.preventDefault() doesn't work if the event is attached through the JSX
    this.blockRef.current.addEventListener('touchstart', this.touchStart, {passive: false});
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
