import {Component, createRef} from 'inferno';
import Two from 'two.js';
import {chartSidePadding, chartMapHeight} from '../../style';
import AnimationGroup, {TestTransition} from '../../helpers/animationGroup';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import memoizeNamedArguments from '../../helpers/memoizeNamedArguments';
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
   * @type {Two}
   */
  twoApp;

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
      canvasWidth: 0,
      canvasHeight: 0
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
    const canvasBlock = this.canvasRef.current.element;

    const twoApp = new Two({
      type: Two.Types.canvas,
      autostart: false
    });
    twoApp.appendTo(canvasBlock);

    this.mapLines = makeMapLines(this.props.lines);
    twoApp.add(...this.mapLines.sceneChildren);

    this.twoApp = twoApp;

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
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
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
          ref={this.canvasRef}
        />
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

    const {clientWidth: canvasWidth, clientHeight: canvasHeight} = this.canvasRef.current.element;
    this.mapLines.update({
      canvasWidth: canvasWidth,
      x: chartSidePadding,
      y: canvasHeight - chartMapHeight,
      width: canvasWidth - chartSidePadding * 2,
      height: chartMapHeight,
      maxValue: mapMaxValue
    }, linesOpacity);
    this.twoApp.render();
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
    const canvasBlock = this.canvasRef.current.element;
    this.twoApp.renderer.setSize(canvasBlock.clientWidth, canvasBlock.clientHeight);
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

function makeMapLines(linesData) {
  const mask = new Two.Rectangle(0, 0, 0, 0);
  mask.clip = true;
  mask.noFill();
  mask.noStroke();

  const container = new Two.Group();
  container.mask = mask;

  const lines = {};
  for (const [key, {values, color}] of Object.entries(linesData)) {
    const line = makeLine({values, color, width: 1});
    container.add(line.sceneChild);
    lines[key] = line;
  }

  return {
    sceneChildren: [container, mask],
    update: memoizeNamedArguments(({
      canvasWidth,
      x,
      y,
      width,
      height,
      maxValue
    }, linesOpacity) => {
      mask.translation.set(x + width / 2, y + height / 2);
      mask.width = width;
      mask.height = height;

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
  const path = new Two.Path([], false, false);
  path.noFill();
  path.stroke = color;
  path.linewidth = width;
  path.cap = 'round';
  path.join = 'round';

  return {
    sceneChild: path,
    update: memoizeNamedArguments(({
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
      if (opacity <= 0 || fromIndex === toIndex || fromValue === toValue) {
        path.visible = false;
        return;
      }

      path.visible = true;
      path.opacity = opacity;

      const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
      const yPerValue = (toY - fromY) / (toValue - fromValue);
      const realFromIndex = Math.floor(Math.max(0, fromIndex - (xPerIndex === 0 ? 0 : (fromX + width / 2) / xPerIndex)));
      const realToIndex = Math.ceil(Math.min(values.length - 1, toIndex + (xPerIndex === 0 ? 0 : (canvasWidth - toX + width / 2) / xPerIndex)));
      let vertexIndex = 0;

      for (let i = realFromIndex; i <= realToIndex; ++i) {
        const x = fromX + (i - fromIndex) * xPerIndex;
        const y = fromY + (values[i] - fromValue) * yPerValue;
        let vertex = path.vertices[vertexIndex];

        if (vertex) {
          vertex.x = x;
          vertex.y = y;
        } else {
          path.vertices.push(new Two.Anchor(x, y));
        }

        vertexIndex++;
      }

      path.vertices.splice(vertexIndex, path.vertices.length);
    })
  };
}
