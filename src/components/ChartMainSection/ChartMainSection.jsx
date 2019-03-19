import {Component} from 'inferno';
import memoizeOne from 'memoize-one';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import AnimationGroup, {TestTransition} from '../../helpers/animationGroup';
import ChartLine from '../ChartLine';
import ChartValueScale from '../ChartValueScale/ChartValueScale';

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
        this.transitionGroup.setTargets({
          maxValue,
          maxValueNotchScale: maxValueToNotchScale(maxValue)
        });
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
    const {maxValue, maxValueNotchScale, ...linesOpacity} = this.transitionGroup.getState();

    return <>
      <ChartValueScale
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height - linesBottomMargin}
        fromValue={0}
        toValue={maxValue / (this.props.height - linesBottomMargin - linesTopMargin) * (this.props.height - linesBottomMargin)}
        notchScale={maxValueNotchScale}
        prepareNotchesCount={20}
      />
      {Object.entries(this.props.linesData).map(([key, {color, values}]) => {
        const opacity = linesOpacity[`line_${key}`];

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
            stroke-width={2}
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            style={opacity > 0 ? `opacity: ${opacity};` : 'display: none;'}
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
    const getMaxValue = memoizeOne(() => this.getDataMaxValue());

    const transitions = {
      maxValue: () => new TestTransition({
        initialValue: getMaxValue()
      }),
      maxValueNotchScale: () => new TestTransition({
        initialValue: maxValueToNotchScale(getMaxValue())
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

/**
 * @see ChartValueScale.jsx
 */
function maxValueToNotchScale(value) {
  return Math.floor(Math.log10(value) * 3 - 1.7);
}
