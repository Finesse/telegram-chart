import {Component} from 'inferno';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import ChartLine from '../ChartLine';
import styles from './ChartMainSection.css?module';

const linesTopMargin = 20;
const linesBottomMargin = 31;

export default class ChartMainSection extends Component {
  render() {
    const linesEntries = Object.entries(this.props.linesData);

    const maxY = Math.max(0, ...linesEntries.map(([key, {values}]) => {
      return this.props.linesState[key] && this.props.linesState[key].enabled
        ? getMaxOnRange(values, this.props.startIndex, this.props.endIndex)
        : 0;
    }));

    return <>
      <line
        x1={this.props.x}
        y1={this.props.y + this.props.height - linesBottomMargin - 0.5}
        x2={this.props.x + this.props.width}
        y2={this.props.y + this.props.height - linesBottomMargin - 0.5}
        strokeWidth={1}
        className={styles.primaryGrid}
      />
      {linesEntries.map(([key, {color, values}]) => {
        if (!(this.props.linesState[key] && this.props.linesState[key].enabled)) {
          return null;
        }

        return (
          <ChartLine
            values={values}
            canvasWidth={this.props.canvasWidth}
            fromIndex={this.props.startIndex}
            toIndex={this.props.endIndex}
            fromX={this.props.x}
            toX={this.props.x + this.props.width}
            fromValue={0}
            toValue={maxY}
            fromY={this.props.y + this.props.height - linesBottomMargin}
            toY={this.props.y + linesTopMargin}

            key={key}
            stroke={color}
            strokeWidth={2}
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        );
      })}
    </>;
  }
}
