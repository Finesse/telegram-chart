import {memo} from '../../helpers/inferno';
import styles from './ChartMapSelector.css?module';

const selectorHorizontalBorderWidth = 1;
const selectorVerticalBorderWidth = 4;

export default memo(function ChartMapSelector({x, y, width, height, relativeStart, relativeEnd}) {
  const middleX = Math.round(x + (relativeStart + relativeEnd) / 2 * width);
  const startX = Math.min(middleX - selectorVerticalBorderWidth, Math.round(x + relativeStart * width));
  const endX = Math.max(middleX + selectorVerticalBorderWidth, Math.round(x + relativeEnd * width));

  return (
    <>
      {/* The outside areas */}
      <rect
        x={x}
        y={y}
        width={Math.max(0, startX - x)}
        height={height}
        className={styles.outer}
      />
      <rect
        x={endX}
        y={y}
        width={Math.max(0, x + width - endX)}
        height={height}
        className={styles.outer}
      />

      {/* The top and the bottom borders */}
      <rect
        x={startX}
        y={y}
        width={Math.max(0, endX - startX)}
        height={selectorHorizontalBorderWidth}
        className={styles.selectorBorder}
      />
      <rect
        x={startX}
        y={y + height - selectorHorizontalBorderWidth}
        width={Math.max(0, endX - startX)}
        height={selectorHorizontalBorderWidth}
        className={styles.selectorBorder}
      />

      {/* The side borders */}
      <rect
        x={startX}
        y={y + selectorHorizontalBorderWidth}
        width={selectorVerticalBorderWidth}
        height={Math.max(0, height - selectorHorizontalBorderWidth * 2)}
        className={styles.selectorBorder}
      />
      <rect
        x={endX - selectorVerticalBorderWidth}
        y={y + selectorHorizontalBorderWidth}
        width={selectorVerticalBorderWidth}
        height={Math.max(0, height - selectorHorizontalBorderWidth * 2)}
        className={styles.selectorBorder}
      />
    </>
  );
});
