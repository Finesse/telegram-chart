/**
 * Triggers the move callback until the mouse drag is finished. Create in a mousedown event handler.
 */
export function watchMouseDrag({onMove, onEnd}) {
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
export function watchTouchDrag({startTouch, eventTarget = window, onMove, onEnd}) {
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

  eventTarget.addEventListener('touchmove', handleMove);
  eventTarget.addEventListener('touchend', handleEnd);
  eventTarget.addEventListener('touchcancel', handleEnd);

  const destroy = () => {
    eventTarget.removeEventListener('touchmove', handleMove);
    eventTarget.removeEventListener('touchend', handleEnd);
    eventTarget.removeEventListener('touchcancel', handleEnd);
  };

  return {destroy};
}

export function watchHover({element, onMove, onEnd, checkHover = event => true}) {
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
