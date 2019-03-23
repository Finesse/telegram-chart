import {Component, createRef} from 'inferno';
import memoizeOne from 'memoize-one';
import * as PIXI from '../../pixi';
import {makeAnimationGroup, makeTestTransition, makeInstantWhenHiddenTransition} from '../../helpers/animationGroup';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import {formatDate} from '../../helpers/date';
import {themeTransitionDuration, themeTransitionDurationCSS} from '../../style';
import ToggleButton from '../ToggleButton/ToggleButton';
import GestureRecognizer from './GestureRecognizer';
import styles from './Chart.css?module';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 2;

// todo: Add the toggle icons
// todo: Round the elements positions considering the device pixel density
// todo: Use exponential value for animating the lines maxY
// todo: Remove inferno
// todo: Try to optimize the theme switch by not animating the charts that are not visible
export default class Chart extends Component {
  canvasRef = createRef();
  detailsRef = createRef();

  /**
   * @type {PIXI.Application}
   */
  pixiApp;

  canvasWidth = 0;
  canvasHeight = 0;
  pixelRatio = 1;

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
      lines: linesState,
      detailsScreenPosition: null
    };

    const transitions = {
      mapMaxValue: makeTestTransition(this.getMapMaxValue()),
      mainMaxValue: makeTestTransition(this.getMainMaxValue()),
      mainMaxValueNotchScale: makeTestTransition(maxValueToNotchScale(this.getMainMaxValue())),
      dateNotchScale: makeTestTransition(getDateNotchScale(this.state.endIndex - this.state.startIndex)),
      detailsScreenPosition: makeInstantWhenHiddenTransition(
        makeTestTransition(0.5),
        makeTestTransition(0)
      ),
      // theme: makeTestTransition(this.props.theme === 'day' ? 0 : 1, {duration: themeTransitionDuration}),
    };
    for (const [key, {enabled}] of Object.entries(linesState)) {
      transitions[`line_${key}_opacity`] = makeTestTransition(enabled ? 1 : 0);
    }
    this.transitionGroup = makeAnimationGroup(transitions, () => this.updateView());
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

    if (
      prevState.startIndex !== this.state.startIndex ||
      prevState.endIndex !== this.state.endIndex ||
      prevState.detailsScreenPosition !== this.state.detailsScreenPosition
    ) {
      if (this.state.detailsScreenPosition === null || this.state.startIndex === this.state.endIndex) {
        this.transitionGroup.setTargets({
          detailsScreenPosition: [undefined, 0]
        });
      } else {
        const indexRange = this.state.endIndex - this.state.startIndex;
        const detailsIndex = Math.max(0, Math.min(Math.round(this.state.startIndex + this.state.detailsScreenPosition * indexRange), this.getDataLength()));

        this.transitionGroup.setTargets({
          detailsScreenPosition: [(detailsIndex - this.state.startIndex) / indexRange, 1]
        });
      }
    }

    if (prevProps.theme !== this.props.theme) {
      /*
      this.transitionGroup.setTargets({
        theme: this.props.theme === 'day' ? 0 : 1
      });
      */
      // Must be called immediately to have a synchronous with CSS render
      this.updateView();
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
      <div className={`${styles.root}`}>
        <h3 className={styles.name}>{this.props.name}</h3>
        <GestureRecognizer
          className={styles.chart}
          mapSelectorStart={relativeStartIndex}
          mapSelectorEnd={relativeEndIndex}
          onMapSelectorStartChange={this.handleStartIndexChange}
          onMapSelectorMiddleChange={this.handleIndexMove}
          onMapSelectorEndChange={this.handleEndIndexChange}
          onDetailsPositionChange={this.handleDetailsPositionChange}
        >
          <div className={styles.details} ref={this.detailsRef} style="visibility: hidden;">
            <div className={styles.detailsPusher} />
            <div className={styles.detailsContent} style={themeTransitionDurationCSS}>
              <div className={styles.detailsHeader} />
              <ul className={styles.detailsValues}>
                {Object.entries(this.props.lines).map(([key, {color, name}]) => (
                  <li key={key} style={`color: ${color};`}>
                    <div className={styles.detailsPrice} />
                    <div className={styles.detailsLabel}>{name}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.detailsPusher} />
          </div>
          <div className={styles.fade} style={themeTransitionDurationCSS} />
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

  updateView() {
    const {
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      detailsScreenPosition: [detailsScreenPosition, detailsOpacity],
      // theme,
      ...linesState
    } = this.transitionGroup.getState();

    const linesOpacity = {};
    for (const key of Object.keys(this.props.lines)) {
      linesOpacity[key] = linesState[`line_${key}_opacity`];
    }

    const detailsIndex = this.state.startIndex + detailsScreenPosition * (this.state.endIndex - this.state.startIndex);

    this.chartDrawer.update({
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      pixelRatio: this.pixelRatio,
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      startIndex: this.state.startIndex,
      endIndex: this.state.endIndex,
      detailsIndex: detailsIndex,
      detailsOpacity,
      theme: this.props.theme === 'day' ? 0 : 1
    }, linesOpacity);
    this.pixiApp.render();

    this.updateDetailsDOM(detailsScreenPosition, detailsOpacity, Math.round(detailsIndex));
  }

  updateDetailsDOM = memoizeOne((screenPosition, opacity, dataIndex) => {
    const detailsDOM = this.detailsRef.current;

    if (opacity <= 0) {
      detailsDOM.style.visibility = 'hidden';
      return;
    }

    const [leftPusher, contentBlock, rightPusher] = detailsDOM.children;
    const [header, valuesList] = contentBlock.children;

    detailsDOM.style.visibility = '';
    leftPusher.style.flexGrow = screenPosition;
    rightPusher.style.flexGrow = 1 - screenPosition;
    contentBlock.style.opacity = opacity;
    contentBlock.style.transform = `translateY(${(opacity - 1) * 10}px)`;

    header.textContent = formatDate(this.props.x[dataIndex], true);

    let valuesListIndex = 0;
    for (const {values} of Object.values(this.props.lines)) {
      const valueElement = valuesList.children[valuesListIndex++];
      if (valueElement) {
        valueElement.firstElementChild.textContent = values[dataIndex];
      }
    }
  });

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
    this.pixelRatio = window.devicePixelRatio || 1;
    this.pixiApp.renderer.resolution = this.pixelRatio;
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

  handleDetailsPositionChange = relativeX => {
    this.setState({detailsScreenPosition: relativeX});
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
