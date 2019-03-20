import {memo} from '../../helpers/inferno';
import modulo from '../../helpers/modulo';
import styles from './ChartValueScale.css?module';

const lineWidth = 1;

/**
 * `notchScale` determines the distance between the notches measured in the value units.
 * 0 is 1, 1 is 2, 2 is 5, 3 is 10, 4 is 20, 5 is 50 and so on.
 * It can also be not integer, in this case a transitional state is rendered.
 *
 * @todo <text />s significantly reduce the animation smoothness
 */
export default memo(function ChartValueScale({
  x,
  y,
  width,
  height,
  fromValue,
  toValue,
  notchScale,
  prepareNotchesCount = 0
}) {
  const {
    value1: notchValue1,
    value2: notchValue2,
    transition: notchValuesTransition
  } = getNotchValues(notchScale);
  const yPerValue = height / ((toValue - fromValue) || 1);
  const start1Notch = Math.ceil(fromValue / notchValue1) * notchValue1;
  const start2Notch = Math.ceil(fromValue / notchValue2) * notchValue2;
  const notches = [];

  // There is the 0.1 + 0.2 problem here but it is not applicable for the input data so I haven't solved it
  for (let notch1 = start1Notch, notch2 = start2Notch; notch1 < toValue || notch2 < toValue;) {
    let value;
    let opacity;

    if (notch1 === notch2) {
      value = notch1;
      opacity = 1;
      notch1 += notchValue1;
      notch2 += notchValue2;
    } else if (notch1 < notch2) {
      value = notch1;
      opacity = 1 - notchValuesTransition;
      notch1 += notchValue1;
    } else {
      value = notch2;
      opacity = notchValuesTransition;
      notch2 += notchValue2;
    }

    const notchY = y + height - (value - fromValue) * yPerValue;
    const alignedNotchY = Math.round(notchY + lineWidth / 2) - lineWidth / 2;

    notches.push(
      // It's faster without `key` here
      <line
        x1={x}
        y1={alignedNotchY}
        x2={x + width}
        y2={alignedNotchY}
        strokeWidth={lineWidth}
        className={`${styles.line} ${value === 0 ? styles.primary : ''}`}
        style={`opacity: ${opacity};`}
      />,
      /*
      <text
        textAnchor="left"
        x={x}
        y={alignedNotchY - 6}
        className={styles.label}
        style={`opacity: ${opacity};`}
      >
        {value}
      </text>
      */
    );
  }

  // Render a few excess notches to not create and destroy DOM elements during animation
  for (let i = notches.length; i < prepareNotchesCount; ++i) {
    notches.push(
      <line style="display: none;" />,
      // <text style="display: none;" />
    )
  }

  return <g>{notches}</g>;
});

function getNotchValues(scale) {
  return {
    value1: getNotchValue(Math.floor(scale)),
    value2: getNotchValue(Math.ceil(scale)),
    transition: scale % 1
  };
}

function getNotchValue(scale) {
  const scalePrimaryLevel = Math.floor(scale / 3);
  const scaleSecondaryLevel = modulo(scale, 3);
  let scaleMultiplier;

  switch (scaleSecondaryLevel) {
    case 0: scaleMultiplier = 1; break;
    case 1: scaleMultiplier = 2; break;
    case 2: scaleMultiplier = 5; break;
  }

  return (10 ** scalePrimaryLevel) * scaleMultiplier;
}
