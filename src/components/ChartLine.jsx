import shallowEqualObjects from 'shallow-equal/objects';

/**
 * Makes an SVG polyline that displays a chart line with linear interpolation. The line is rendered from the left edge
 * of the parent SVG to the left edge. You need to specify the anchor rectangle so that the component knows where to
 * place the line.
 *
 * X and Y are the SVG coordinates, `values` are the data Ys and its indices are the Xs.
 */
export default function ChartLine({
  values,
  canvasWidth,
  fromIndex,
  toIndex,
  fromX = 0,
  toX = canvasWidth,
  fromValue,
  toValue,
  fromY,
  toY,
  strokeWidth,
  ...polylineProps
}) {
  if (fromIndex === toIndex || toX === fromX) {
    return null; // Line can't be drawn because of division by zero
  }

  const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
  const yPerValue = (toY - fromY) / ((toValue - fromValue) || 1);

  const extraXOffset = typeof strokeWidth === 'number' ? strokeWidth / 2 : 0;
  const realFromIndex = fromIndex - (fromX + extraXOffset) / xPerIndex;
  const realToIndex = toIndex + (canvasWidth - toX + extraXOffset) / xPerIndex;

  const lineFirstIndex = Math.max(0, Math.floor(realFromIndex));
  const lineLastIndex = Math.min(values.length - 1, Math.ceil(realToIndex));

  if (lineLastIndex - lineFirstIndex < 0) {
    return null; // Line can't be drawn because there are no points
  }

  let points = '';
  for (let i = lineFirstIndex; i <= lineLastIndex; ++i) {
    const x = fromX + xPerIndex * (i - fromIndex);
    const y = fromY + yPerValue * (values[i] - fromValue);
    points += `${x},${y} `;
  }

  return <polyline points={points} strokeWidth={strokeWidth} {...polylineProps} />;
}

ChartLine.defaultHooks = {
  // Memoize the component render result
  onComponentShouldUpdate(prevProps, nextProps) {
    return !shallowEqualObjects(prevProps, nextProps);
  }
};
