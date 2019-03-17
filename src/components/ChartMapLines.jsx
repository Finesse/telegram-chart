import {Component} from 'inferno';
import {PureComponent} from '../helpers/inferno';
import SpringAnimation from '../helpers/SpringAnimation';
import ChartLine from './ChartLine';

export default class ChartMapLines extends PureComponent {
  id = `mapLines_${Math.random()}`;

  state = {
    animatedMaxValue: this.getDataMaxY(),
  };

  maxValueAnimation = new SpringAnimation({
    initialValue: this.state.animatedMaxValue,
    onChange: value => this.setState({animatedMaxValue: value})
  });

  getDataMaxY() {
    const linesEntries = Object.entries(this.props.linesData);

    return Math.max(...linesEntries.map(([key, {values}]) => {
      return this.props.linesState[key] && this.props.linesState[key].enabled
        ? Math.max(...values) // todo: Memoize
        : 0;
    }));
  }

  componentDidUpdate() {
    this.maxValueAnimation.goTo(this.getDataMaxY());
  }

  componentWillUnmount() {
    this.maxValueAnimation.destroy();
  }

  render() {
    return <>
      {/* A rectangle to prevent lines from overflowing the block */}
      <defs>
        <rect
          id={`${this.id}_clipRect`}
          x={this.props.x}
          y={this.props.y}
          width={Math.max(0, this.props.width)}
          height={Math.max(0, this.props.height)}
        />
        <clipPath id={`${this.id}_clip`}>
          <use xlinkHref={`#${this.id}_clipRect`}/>
        </clipPath>
      </defs>

      {/* The lines */}
      <g clipPath={`url(#${this.id}_clip)`}>
        {Object.entries(this.props.linesData).map(([key, {color, values}]) => (
          <ChartMapLine
            key={key}
            enabled={this.props.linesState[key] && this.props.linesState[key].enabled}
            color={color}
            values={values}
            canvasWidth={this.props.canvasWidth}
            x={this.props.x}
            y={this.props.y}
            width={this.props.width}
            height={this.props.height}
            maxValue={this.state.animatedMaxValue}
          />
        ))}
      </g>
    </>;
  }
}

class ChartMapLine extends Component {
  state = {
    animatedOpacity: this.props.enabled ? 1 : 0,
  };

  opacityAnimation = new SpringAnimation({
    initialValue: this.state.animatedOpacity,
    onChange: value => this.setState({animatedOpacity: value})
  });

  componentDidUpdate() {
    this.opacityAnimation.goTo(this.props.enabled ? 1 : 0);
  }

  componentWillUnmount() {
    this.opacityAnimation.destroy();
  }

  render() {
    if (this.state.animatedOpacity <= 0) {
      return null;
    }

    return (
      <ChartLine
        values={this.props.values}
        canvasWidth={this.props.canvasWidth}
        fromIndex={0}
        toIndex={this.props.values.length - 1}
        fromX={this.props.x}
        toX={this.props.x + this.props.width}
        fromValue={0}
        toValue={this.props.maxValue}
        fromY={this.props.y + this.props.height - 2}
        toY={this.props.y + 2}

        stroke={this.props.color}
        strokeWidth={1}
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        style={`opacity: ${this.state.animatedOpacity};`}
      />
    );
  }
}
