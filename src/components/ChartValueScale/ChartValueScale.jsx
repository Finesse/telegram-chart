import {Fragment} from 'inferno';
import {memo} from '../../helpers/inferno';
import modulo from '../../helpers/modulo';
import styles from './ChartValueScale.css?module';

const lineWidth = 1;

export default memo(function ChartValueScale({x, y, width, height, fromValue, toValue, notchScale}) {
  const notchValue = getNotchValue(notchScale);
  const yPerValue = height / ((toValue - fromValue) || 1);
  const startNotch = Math.ceil(fromValue / notchValue) * notchValue;
  const endNotch = Math.floor(toValue / notchValue) * notchValue;
  const notches = [];

  for (let i = startNotch; i <= endNotch; i += notchValue) {
    const notchY = y + height - (i - fromValue) * yPerValue;
    const alignedNotchY = Math.round(notchY + lineWidth / 2) - lineWidth / 2;

    notches.push(
      <Fragment key={i}>
        <line
          x1={x}
          y1={alignedNotchY}
          x2={x + width}
          y2={alignedNotchY}
          strokeWidth={lineWidth}
          className={`${styles.line} ${i === 0 ? styles.primary : ''}`}
        />
        <text textAnchor="left" x={x} y={alignedNotchY} className={styles.label}>{i}</text>
      </Fragment>
    );
  }

  if (!notches) {
    return null;
  }

  return <g>{notches}</g>;
});

function getNotchValue(scale) {
  scale = Math.floor(scale);
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
