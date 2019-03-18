import {Component} from 'inferno';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import AnimationGroup, {TestTransition} from '../../helpers/animationGroup';
import ChartLine from '../ChartLine';
import styles from './ChartMainSection.css?module';

const linesTopMargin = 20;
const linesBottomMargin = 31;

export default class ChartMainSection extends Component {
  transitionGroup = new AnimationGroup(this.makeTransitions(), () => this.forceUpdate());

  componentDidUpdate(prevProps) {
    if (prevProps.linesData !== this.props.linesData) {
      this.transitionGroup.setAnimations(this.makeTransitions());
    }

    // Launch the transitions
    if (
      prevProps.linesData !== this.props.linesData ||
      prevProps.linesState !== this.props.linesState ||
      prevProps.startIndex !== this.props.startIndex ||
      prevProps.endIndex !== this.props.endIndex
    ) {
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
      <line
        x1={this.props.x}
        y1={this.props.y + this.props.height - linesBottomMargin - 0.5}
        x2={this.props.x + this.props.width}
        y2={this.props.y + this.props.height - linesBottomMargin - 0.5}
        strokeWidth={1}
        className={styles.primaryGrid}
      />
      {Object.entries(this.props.linesData).map(([key, {color, values}]) => {
        const opacity = linesOpacity[`line_${key}`];
        if (opacity <= 0) {
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
            toValue={maxValue}
            fromY={this.props.y + this.props.height - linesBottomMargin}
            toY={this.props.y + linesTopMargin}

            key={key}
            stroke={color}
            strokeWidth={2}
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={`opacity: ${opacity};`}
          />
        );
      })}
    </>;
  }

  getDataMaxValue() {
    const linesEntries = Object.entries(this.props.linesData);

    return Math.max(0, ...linesEntries.map(([key, {values}]) => {
      return this.props.linesState[key] && this.props.linesState[key].enabled
        ? getMaxOnRange(values, this.props.startIndex, this.props.endIndex)
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
