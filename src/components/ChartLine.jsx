import {Component} from 'inferno';
import memoizeOne from 'memoize-one';

/**
 * Makes an SVG polyline that displays a chart line with linear interpolation. The line is rendered from the left edge
 * of the parent SVG to the left edge. You need to specify the anchor rectangle so that the component knows where to
 * place the line.
 *
 * X and Y are the SVG coordinates, `values` are the data Ys and its indices are the Xs.
 */
export default class ChartLine extends Component {
  // Memoization is used to not reassemble the points string when the line position has changed
  makePointsString = memoizeOne(values => {
    if (values.length === 0) {
      return '';
    }

    let minValue = values[0];
    let maxValue = values[0];

    for (let i = 1; i < values.length; ++i) {
      if (values[i] < minValue) {
        minValue = values[i];
      } else if (values[i] > maxValue) {
        maxValue = values[i];
      }
    }

    const xPerIndex = 1 / ((values.length - 1) || 1);
    const yPerValue = 1 / ((maxValue - minValue) || 1);
    let pointsString = '';

    for (let i = 0; i < values.length; ++i) {
      pointsString += `${i * xPerIndex},${(values[i] - minValue) * yPerValue} `;
    }

    return {pointsString, minValue, maxValue};
  });

  render() {
    const {
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
      style = '',
      ...polylineProps
    } = this.props;

    if (fromIndex === toIndex || fromValue === toValue) {
      return null; // Line can't be drawn because of division by zero
    }

    const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
    const yPerValue = (toY - fromY) / (toValue - fromValue);
    const {pointsString, minValue, maxValue} = this.makePointsString(values);
    const styleWithTransform = `${style}; transform:`
      + ` translate(${fromX - fromIndex * xPerIndex}px, ${fromY + (minValue - fromValue) * yPerValue}px)`
      + ` scaleX(${(values.length - 1) * xPerIndex})`
      + ` scaleY(${(maxValue - minValue) * yPerValue})`;

    return <polyline points={pointsString} style={styleWithTransform} {...polylineProps} />;
  }
}
