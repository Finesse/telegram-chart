import {Component, createRef} from 'inferno';
import * as PIXI from '../../pixi';
import AnimationGroup, {TestTransition} from '../../helpers/animationGroup';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import ToggleButton from '../ToggleButton/ToggleButton';
import GestureRecognizer from './GestureRecognizer';
import styles from './Chart.css?module';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 2;

// todo: Add the toggle icons
// todo: Add the selected column information
// todo: Round the elements positions considering the device pixel density
// todo: Use exponential value for animating the lines maxY
// todo: Remove inferno
export default class Chart extends Component {
  canvasRef = createRef();

  /**
   * @type {PIXI.Application}
   */
  pixiApp;

  canvasWidth = 0;
  canvasHeight = 0;

  constructor(props) {
    super(props);

    const linesState = {};
    for (const key of Object.keys(props.lines)) {
      linesState[key] = {
        enabled: true
      }
    }

    this.state = {
      startIndex: this.getDataLength() * 0.73,
      endIndex: this.getDataLength(),
      lines: linesState
    };

    const transitions = {
      mapMaxValue: () => new TestTransition({initialValue: this.getMapMaxValue()}),
      mainMaxValue: () => new TestTransition({initialValue: this.getMainMaxValue()}),
      mainMaxValueNotchScale: () => new TestTransition({
        initialValue: maxValueToNotchScale(this.getMainMaxValue())
      }),
      dateNotchScale: () => new TestTransition({
        initialValue: getDateNotchScale(this.state.endIndex - this.state.startIndex)
      })
    };
    for (const [key, {enabled}] of Object.entries(linesState)) {
      transitions[`line_${key}_opacity`] = () => new TestTransition({initialValue: enabled ? 1 : 0});
    }
    this.transitionGroup = new AnimationGroup(transitions, () => this.renderChart());
  }

  getDataLength() {
    return this.props.x.length - 1;
  }

  getMapMaxValue() {
    const linesEntries = Object.entries(this.props.lines);

    return Math.max(0, ...linesEntries.map(([key, {values}]) => {
      return this.state.lines[key].enabled
        ? Math.max(...values)
        : 0;
    }));
  }

  getMainMaxValue() {
    const linesEntries = Object.entries(this.props.lines);

    return Math.max(0, ...linesEntries.map(([key, {values}]) => {
      return this.state.lines[key].enabled
        ? getMaxOnRange(values, this.state.startIndex, this.state.endIndex)
        : 0;
    }));
  }

  componentDidMount() {
    const app = new PIXI.Application({
      view: this.canvasRef.current,
      autoStart: false,
      antialias: true,
      transparent: true
    });

    this.chartDrawer = makeChartDrawer(this.props.lines, this.props.x);
    app.stage.addChild(...this.chartDrawer.stageChildren);
    this.pixiApp = app;

    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.lines !== this.state.lines) {
      const mapMaxValue = this.getMapMaxValue();
      if (mapMaxValue > 0) {
        // Don't shrink the chart when all the lines are disabled
        this.transitionGroup.setTargets({mapMaxValue});
      }

      for (const [key, {enabled}] of Object.entries(this.state.lines)) {
        this.transitionGroup.setTargets({[`line_${key}_opacity`]: enabled ? 1 : 0});
      }
    }

    if (
      prevState.lines !== this.state.lines ||
      prevState.startIndex !== this.state.startIndex ||
      prevState.endIndex !== this.state.endIndex
    ) {
      const mainMaxValue = this.getMainMaxValue();
      if (mainMaxValue > 0) {
        // Don't shrink the chart when all the lines are disabled
        this.transitionGroup.setTargets({
          mainMaxValue,
          mainMaxValueNotchScale: maxValueToNotchScale(mainMaxValue)
        });
      }
    }

    if (prevState.startIndex !== this.state.startIndex || prevState.endIndex !== this.state.endIndex) {
      this.transitionGroup.setTargets({
        dateNotchScale: getDateNotchScale(this.state.endIndex - this.state.startIndex)
      });

      // It works much smoother if you update on the next frame but not immediately
      this.transitionGroup.updateOnNextFrame();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    this.pixiApp.destroy();
  }

  render() {
    const relativeStartIndex = this.state.startIndex / (this.getDataLength() || 1);
    const relativeEndIndex = this.state.endIndex / (this.getDataLength() || 1);

    return (
      <div className={styles.root}>
        <h3 className={styles.name}>{this.props.name}</h3>
        <GestureRecognizer
          className={styles.chart}
          mapSelectorStart={relativeStartIndex}
          mapSelectorEnd={relativeEndIndex}
          onMapSelectorStartChange={this.handleStartIndexChange}
          onMapSelectorMiddleChange={this.handleIndexMove}
          onMapSelectorEndChange={this.handleEndIndexChange}
        >
          <div className={styles.fade} />
          <canvas className={styles.canvas} ref={this.canvasRef} />
        </GestureRecognizer>
        <div className={styles.toggles}>
          {Object.entries(this.props.lines).map(([key, {name, color}]) => (
            <ToggleButton
              key={key}
              color={color}
              name={name}
              on={this.state.lines[key] && this.state.lines[key].enabled}
              className={styles.toggle}
              clickData={key}
              onClick={this.handleLineToggle}
            />
          ))}
        </div>
      </div>
    );
  }

  renderChart() {
    const {
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      ...linesState
    } = this.transitionGroup.getState();

    const linesOpacity = {};
    for (const key of Object.keys(this.props.lines)) {
      linesOpacity[key] = linesState[`line_${key}_opacity`];
    }

    this.chartDrawer.update({
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      startIndex: this.state.startIndex,
      endIndex: this.state.endIndex
    }, linesOpacity);
    this.pixiApp.render();
  }

  handleLineToggle = key => {
    const {lines} = this.state;

    this.setState({
      lines: {
        ...lines,
        [key]: {
          ...lines[key],
          enabled: !(lines[key] && lines[key].enabled)
        }
      }
    });
  };

  handleWindowResize = () => {
    const canvas = this.canvasRef.current;
    this.canvasWidth = canvas.clientWidth;
    this.canvasHeight = canvas.clientHeight;
    this.pixiApp.renderer.resolution = window.devicePixelRatio || 1;
    this.pixiApp.renderer.resize(this.canvasWidth, this.canvasHeight);
    this.transitionGroup.updateOnNextFrame();
  };

  handleStartIndexChange = relativeIndex => {
    const x = relativeIndex * this.getDataLength();
    const startIndex = Math.max(0, Math.min(x, this.getDataLength() - minMapSelectionLength));
    const endIndex = Math.max(this.state.endIndex, startIndex + minMapSelectionLength);

    this.setState({startIndex, endIndex});
  };

  handleEndIndexChange = relativeIndex => {
    const x = relativeIndex * this.getDataLength();
    const endIndex = Math.max(minMapSelectionLength, Math.min(x, this.getDataLength()));
    const startIndex = Math.min(this.state.startIndex, endIndex - minMapSelectionLength);

    this.setState({startIndex, endIndex});
  };

  handleIndexMove = relativeMiddleX => {
    const x = relativeMiddleX * this.getDataLength();
    const currentXLength = this.state.endIndex - this.state.startIndex;
    const startIndex = Math.min(Math.max(0, x - currentXLength / 2), this.getDataLength() - currentXLength);
    const endIndex = startIndex + currentXLength;

    this.setState({startIndex, endIndex});
  };
}

/**
 * @see The valueScale.js file
 */
function maxValueToNotchScale(value) {
  return Math.floor(Math.log10(value) * 3 - 1.7);
}

/**
 * @see The dateScale.js file
 */
function getDateNotchScale(datesCount) {
  if (datesCount <= 0) {
    return 1e9;
  }

  const maxDatesCount = 6;

  return Math.max(0, Math.ceil(Math.log2(datesCount / maxDatesCount)));
}
