import {PureComponent} from '../helpers/inferno';
import AnimationGroup, {TestTransition} from '../helpers/animationGroup';
import ChartLine from './ChartLine';

// todo: Make text draw over the lines
// todo: Add the date scale
export default class ChartMapLines extends PureComponent {
  id = `mapLines_${Math.random()}`;

  transitionGroup = new AnimationGroup(this.makeTransitions(), () => this.forceUpdate());

  componentDidUpdate(prevProps) {
    if (prevProps.linesData !== this.props.linesData) {
      this.transitionGroup.setAnimations(this.makeTransitions());
    }

    // Launch the transitions
    if (prevProps.linesData !== this.props.linesData || prevProps.linesState !== this.props.linesState) {
      const maxValue = this.getDataMaxValue();
      if (maxValue > 0) {
        // Don't shrink the chart when all the lines are disabled
        this.transitionGroup.setTargets({maxValue});
      }

      for (const [key, {enabled}] of Object.entries(this.props.linesState)) {
        this.transitionGroup.setTargets({[`line_${key}`]: enabled ? 1 : 0});
      }
    }
  }

  componentWillUnmount() {
    this.transitionGroup.destroy();
  }

  render() {
    const {maxValue, ...linesOpacity} = this.transitionGroup.getState();

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
        {Object.entries(this.props.linesData).map(([key, {color, values}]) => {
          const opacity = linesOpacity[`line_${key}`];

          return (
            <ChartLine
              values={values}
              canvasWidth={this.props.canvasWidth}
              fromIndex={0}
              toIndex={values.length - 1}
              fromX={this.props.x}
              toX={this.props.x + this.props.width}
              fromValue={0}
              toValue={maxValue}
              fromY={this.props.y + this.props.height - 2}
              toY={this.props.y + 2}

              key={key}
              stroke={color}
              stroke-width={1}
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
              style={opacity > 0 ? `opacity: ${opacity};` : 'display: none;'}
            />
          );
        })}
      </g>
    </>;
  }

  getDataMaxValue() {
    const linesEntries = Object.entries(this.props.linesData);

    return Math.max(0, ...linesEntries.map(([key, {values}]) => {
      return this.props.linesState[key] && this.props.linesState[key].enabled
        ? Math.max(...values)
        : 0;
    }));
  }

  makeTransitions() {
    const transitions = {
      maxValue: () => new TestTransition({
        initialValue: this.getDataMaxValue()
      })
    };

    for (const key of Object.keys(this.props.linesData)) {
      transitions[`line_${key}`] = () => new TestTransition({
        initialValue: this.props.linesState[key] && this.props.linesState[key].enabled ? 1 : 0
      });
    }

    return transitions;
  }
}
