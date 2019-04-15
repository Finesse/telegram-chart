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

  const handleMove = event => {
    eachSubEvent(event, (id, subEvent) => {
      if ((hoverId === null || id === hoverId)) {
        if (checkHover(subEvent)) {
          hoverId = id;
          onMove(subEvent);
        } else if (hoverId !== null) {
          hoverId = null;
          onEnd(subEvent);
        }
      }
    });
  };

  const handleEnd = event => {
    eachSubEvent(event, (id, subEvent) => {
      if (hoverId === id) {
        event.preventDefault(); // To prevent the frozen hover on touch devices
        hoverId = null;
        onEnd(subEvent);
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

export function watchLongTap(element, onShortTap, onLongTap, longTapTime = 500, maxTapDistance = 10) {
  let tapId;
  let tapStartCoordinates;
  let timeoutId;

  const permanentEventHandlers = {
    mousedown: handleTapStart,
    touchstart: handleTapStart,
    touchmove: handleTapMove,
    touchend: handleTapEnd,
    touchcancel: handleTapEnd,
    contextmenu: preventDefault // To prevent the context menu on a long touch
  };

  for (const event in permanentEventHandlers) {
    if (permanentEventHandlers.hasOwnProperty(event)) {
      element.addEventListener(event, permanentEventHandlers[event]);
    }
  }

  return {
    destroy() {
      clearAfterTap();
      for (const event in permanentEventHandlers) {
        if (permanentEventHandlers.hasOwnProperty(event)) {
          element.removeEventListener(event, permanentEventHandlers[event]);
        }
      }
    }
  };

  function handleTapStart(event) {
    eachSubEvent(event, (id, subEvent) => {
      clearAfterTap();
      tapId = id;
      tapStartCoordinates = getEventCoordinates(subEvent);
      timeoutId = setTimeout(handleTapTimeout, longTapTime);

      if (id === 'mouse') {
        event.preventDefault();
        window.addEventListener('mousemove', handleTapMove);
        window.addEventListener('mouseup', handleTapEnd);
      }
    });
  }

  function handleTapMove(event) {
    eachSubEvent(event, (id, subEvent) => {
      if (id === tapId) {
        if (!isInTapDistance(getEventCoordinates(subEvent))) {
          clearAfterTap();
        }
      }
    });
  }

  function handleTapEnd(event) {
    event.preventDefault(); // To prevent excess artificial mouse events after releasing the element

    eachSubEvent(event, id => {
      if (id === tapId) {
        clearAfterTap();
        onShortTap();
      }
    });
  }

  function handleTapTimeout() {
    clearAfterTap();
    onLongTap();
  }

  function clearAfterTap() {
    if (tapId === 'mouse') {
      window.removeEventListener('mousemove', handleTapMove);
      window.removeEventListener('mouseup', handleTapEnd);
    }
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    tapId = undefined;
    tapStartCoordinates = undefined;
  }

  function isInTapDistance(coordinates) {
    if (!tapStartCoordinates) {
      return false;
    }

    return (coordinates[0] - tapStartCoordinates[0]) ** 2 + (coordinates[1] - tapStartCoordinates[1]) ** 2
      <= maxTapDistance ** 2;
  }

  function getEventCoordinates(event) {
    return [event.clientX, event.clientY];
  }
}

function eachSubEvent(event, callback) {
  if (event.type.startsWith('mouse')) {
    callback('mouse', event);
  } else if (event.type.startsWith('touch')) {
    for (const touch of event.changedTouches) {
      callback(`touch${touch.identifier}`, touch);
    }
  }
}

function preventDefault(event) {
  event.preventDefault();
}
