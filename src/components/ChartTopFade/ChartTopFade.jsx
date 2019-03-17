import {PureComponent} from '../../helpers/inferno';
import styles from './ChartTopFade.css?module';

export default class ChartTopFade extends PureComponent {
  id = `fade_${Math.random()}`;

  render() {
    return (
      <>
        <linearGradient id={this.id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopOpacity={1} className={styles.stop} />
          <stop offset="100%" stopOpacity={0} className={styles.stop} />
        </linearGradient>
        <rect
          x={this.props.x}
          y={this.props.x}
          width={this.props.width}
          height={this.props.height}
          fill={`url(#${this.id})`}
        />
      </>
    );
  }
}
