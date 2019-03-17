import {Component} from 'inferno';
import shallowEqualObjects from 'shallow-equal/objects';
import ChartLine from './ChartLine';

export default class ChartMapLines extends Component {
  // Memoize the component render result
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqualObjects(this.props, nextProps) || !shallowEqualObjects(this.state, nextState);
  }

  render() {
    const linesEntries = Object.entries(this.props.linesData);

    const maxY = Math.max(...linesEntries.map(([key, {values}]) => {
      return this.props.linesState[key] && this.props.linesState[key].enabled
        ? Math.max(...values) // todo: Memoize
        : 0;
    }));

    return <>
      {linesEntries.map(([key, {color, values}]) => {
        if (!(this.props.linesState[key] && this.props.linesState[key].enabled)) {
          return null;
        }

        return (
          <ChartLine
            values={values}
            canvasWidth={this.props.canvasWidth}
            fromIndex={0}
            toIndex={values.length - 1}
            fromX={this.props.x}
            toX={this.props.x + this.props.width}
            fromValue={0}
            toValue={maxY}
            fromY={this.props.y + this.props.height - 2}
            toY={this.props.y + 2}

            key={key}
            stroke={color}
            strokeWidth={1}
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        );
      })}
    </>;
  }
}
