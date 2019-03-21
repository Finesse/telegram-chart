import {Component, createRef} from 'inferno';
import * as PIXI from '../../pixi';
import {chartSidePadding, chartMapHeight} from '../../style';
import AnimationGroup, {TestTransition} from '../../helpers/animationGroup';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import memoizeObjectArguments from '../../helpers/memoizeObjectArguments';
import ToggleButton from '../ToggleButton/ToggleButton';
import GestureRecognizer from './GestureRecognizer';
import styles from './Chart.css?module';

const minMapSelectionLength = 2;

// todo: Add the toggle icons
// todo: Add the selected column information
// todo: Round the elements positions considering the device pixel density
// todo: Use exponential value for animating the lines maxY
export default class Chart extends Component {
  canvasRef = createRef();

  /**
   * @type {PIXI.Application}
   */
  pixiApp;

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

    this.chartDrawer = makeChart(this.props.lines, this.props.x);
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
        this.transitionGroup.setTargets({mainMaxValue});
      }
    }

    if (prevState.startIndex !== this.state.startIndex || prevState.endIndex !== this.state.endIndex) {
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
    const {mapMaxValue, mainMaxValue, ...linesState} = this.transitionGroup.getState();

    const linesOpacity = {};
    for (const key of Object.keys(this.props.lines)) {
      linesOpacity[key] = linesState[`line_${key}_opacity`];
    }

    this.chartDrawer.update({
      canvasWidth: this.pixiApp.renderer.width / this.pixiApp.renderer.resolution,
      canvasHeight: this.pixiApp.renderer.height / this.pixiApp.renderer.resolution,
      mapMaxValue,
      mainMaxValue,
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
    this.pixiApp.renderer.resolution = window.devicePixelRatio || 1;
    this.pixiApp.renderer.resize(canvas.clientWidth, canvas.clientHeight);
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

function makeChart(linesData, dates) {
  const mapLines = makeMapLines(linesData);
  const mapSelector = makeMapSelector();

  const datesLength = dates.length - 1;

  return {
    stageChildren: [...mapLines.stageChildren, ...mapSelector.stageChildren],
    update({
      canvasWidth,
      canvasHeight,
      mapMaxValue,
      mainMaxValue,
      startIndex,
      endIndex
    }, linesOpacity) {
      mapLines.update({
        canvasWidth,
        x: chartSidePadding,
        y: canvasHeight - chartMapHeight,
        width: canvasWidth - chartSidePadding * 2,
        height: chartMapHeight,
        maxValue: mapMaxValue
      }, linesOpacity);

      mapSelector.update({
        x: chartSidePadding,
        y: canvasHeight - chartMapHeight,
        width: canvasWidth - chartSidePadding * 2,
        height: chartMapHeight,
        relativeStart: startIndex / datesLength,
        relativeEnd: endIndex / datesLength
      });
    }
  }
}

function makeMapSelector() {
  const selectorHorizontalBorderWidth = 1;
  const selectorVerticalBorderWidth = 4;
  const outsideColor = 0xF6F8F2;
  const outsideOpacity = 0.8;
  const borderColor = 0x3076A7;
  const borderOpacity = 0.16;

  const outsideLeft = new PIXI.Graphics();
  const outsideRight = new PIXI.Graphics();
  const borderTop = new PIXI.Graphics();
  const borderBottom = new PIXI.Graphics();
  const borderLeft = new PIXI.Graphics();
  const borderRight = new PIXI.Graphics();

  return {
    stageChildren: [outsideLeft, outsideRight, borderTop, borderBottom, borderLeft, borderRight],
    update: memoizeObjectArguments(({x, y, width, height, relativeStart, relativeEnd}) => {
      const middleX = Math.round(x + (relativeStart + relativeEnd) / 2 * width);
      const startX = Math.min(middleX - selectorVerticalBorderWidth, Math.round(x + relativeStart * width));
      const endX = Math.max(middleX + selectorVerticalBorderWidth, Math.round(x + relativeEnd * width));

      outsideLeft.clear();
      outsideLeft.beginFill(outsideColor, outsideOpacity);
      outsideLeft.drawRect(x, y, Math.max(0, startX - x), height);

      outsideRight.clear();
      outsideRight.beginFill(outsideColor, outsideOpacity);
      outsideRight.drawRect(endX, y, Math.max(0, x + width - endX), height);

      borderTop.clear();
      borderTop.beginFill(borderColor, borderOpacity);
      borderTop.drawRect(startX, y, Math.max(0, endX - startX), selectorHorizontalBorderWidth);

      borderBottom.clear();
      borderBottom.beginFill(borderColor, borderOpacity);
      borderBottom.drawRect(startX, y + height - selectorHorizontalBorderWidth, Math.max(0, endX - startX), selectorHorizontalBorderWidth);

      borderLeft.clear();
      borderLeft.beginFill(borderColor, borderOpacity);
      borderLeft.drawRect(startX, y + selectorHorizontalBorderWidth, selectorVerticalBorderWidth, Math.max(0, height - selectorHorizontalBorderWidth * 2));

      borderRight.clear();
      borderRight.beginFill(borderColor, borderOpacity);
      borderRight.drawRect(endX - selectorVerticalBorderWidth, y + selectorHorizontalBorderWidth, selectorVerticalBorderWidth, Math.max(0, height - selectorHorizontalBorderWidth * 2));
    })
  };
}

function makeMapLines(linesData) {
  const mask = new PIXI.Graphics();
  const container = new PIXI.Container();
  container.mask = mask;

  const lines = {};
  for (const [key, {values, color}] of Object.entries(linesData)) {
    const line = makeLine({values, color, width: 1});
    container.addChild(line.stageChild);
    lines[key] = line;
  }

  return {
    stageChildren: [container, mask],
    update: memoizeObjectArguments(({
      canvasWidth,
      x,
      y,
      width,
      height,
      maxValue
    }, linesOpacity) => {
      mask.clear();
      mask.beginFill(0x000000);
      mask.drawRect(x, y, width, height);

      for (const [key, line] of Object.entries(lines)) {
        line.update({
          canvasWidth,
          fromIndex: 0,
          toIndex: linesData[key].values.length - 1,
          fromX: x,
          toX: x + width,
          fromValue: 0,
          toValue: maxValue,
          fromY: y + height,
          toY: y,
          opacity: linesOpacity[key]
        });
      }
    })
  };
}

function makeLine({values, color, width}) {
  const path = new PIXI.Graphics();

  return {
    stageChild: path,
    update: memoizeObjectArguments(({
      canvasWidth,
      fromIndex,
      toIndex,
      fromX = 0,
      toX = canvasWidth,
      fromValue,
      toValue,
      fromY,
      toY,
      opacity = 1
    }) => {
      path.clear();

      if (opacity <= 0 || fromIndex === toIndex || fromValue === toValue) {
        return;
      }

      const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
      const yPerValue = (toY - fromY) / (toValue - fromValue);
      const realFromIndex = Math.floor(Math.max(0, fromIndex - (xPerIndex === 0 ? 0 : (fromX + width / 2) / xPerIndex)));
      const realToIndex = Math.ceil(Math.min(values.length - 1, toIndex + (xPerIndex === 0 ? 0 : (canvasWidth - toX + width / 2) / xPerIndex)));

      path.lineStyle(width, colorHexToPixi(color), opacity, 0.5);

      for (let i = realFromIndex; i <= realToIndex; ++i) {
        const x = fromX + (i - fromIndex) * xPerIndex;
        const y = fromY + (values[i] - fromValue) * yPerValue;

        if (i === realFromIndex) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
    })
  };
}

function colorHexToPixi(color) {
  return parseInt(color.slice(1), 16);
}
