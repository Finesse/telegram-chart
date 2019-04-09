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
