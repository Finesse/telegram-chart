import {Component, createRef} from 'inferno';
import {Application as PixiApplication} from '@pixi/app';
import {Container as PixiContainer} from '@pixi/display';
import {Graphics as PixiGraphics} from '@pixi/graphics';
import memoizeOne from 'memoize-one';
import {chartSidePadding, chartMapHeight} from '../../style';
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
      startX: this.getDataLength() * 0.73,
      endX: this.getDataLength(),
      lines: linesState,
      canvasWidth: 0,
      canvasHeight: 0
    };
  }

  getDataLength() {
    return this.props.x.length - 1;
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;

    const app = new PixiApplication({
      view: canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      autoStart: false,
      antialias: true,
      transparent: true
    });

    this.mapLines = makeMapLines(this.props.lines);
    app.stage.addChild(...this.mapLines.stageChildren);

    this.pixiApp = app;

    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    this.pixiApp.destroy();
  }

  render() {
    const relativeStartX = this.state.startX / (this.getDataLength() || 1);
    const relativeEndX = this.state.endX / (this.getDataLength() || 1);

    return (
      <div className={styles.root}>
        <h3 className={styles.name}>{this.props.name}</h3>
        <GestureRecognizer
          className={styles.chart}
          mapSelectorStart={relativeStartX}
          mapSelectorEnd={relativeEndX}
          onMapSelectorStartChange={this.handleStartXChange}
          onMapSelectorMiddleChange={this.handleXMove}
          onMapSelectorEndChange={this.handleEndXChange}
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
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    this.pixiApp.renderer.resolution = window.devicePixelRatio || 1;
    this.pixiApp.renderer.resize(canvasWidth, canvasHeight);
    this.mapLines.update({
      canvasWidth: canvasWidth,
      x: chartSidePadding,
      y: canvasHeight - chartMapHeight,
      width: canvasWidth - chartSidePadding * 2,
      height: chartMapHeight,
      maxValue: 200
    });
    this.pixiApp.render();
  };

  handleStartXChange = relativeX => {
    const x = relativeX * this.getDataLength();
    const startX = Math.max(0, Math.min(x, this.getDataLength() - minMapSelectionLength));
    const endX = Math.max(this.state.endX, startX + minMapSelectionLength);

    this.setState({startX, endX});
  };

  handleEndXChange = relativeX => {
    const x = relativeX * this.getDataLength();
    const endX = Math.max(minMapSelectionLength, Math.min(x, this.getDataLength()));
    const startX = Math.min(this.state.startX, endX - minMapSelectionLength);

    this.setState({startX, endX});
  };

  handleXMove = relativeMiddleX => {
    const x = relativeMiddleX * this.getDataLength();
    const currentXLength = this.state.endX - this.state.startX;
    const startX = Math.min(Math.max(0, x - currentXLength / 2), this.getDataLength() - currentXLength);
    const endX = startX + currentXLength;

    this.setState({startX, endX});
  };
}

function makeMapLines(linesData) {
  const mask = new PixiGraphics();
  const container = new PixiContainer();
  container.mask = mask;

  const lines = {};
  for (const [key, {values, color}] of Object.entries(linesData)) {
    const line = makeLine({values, color, width: 1});
    container.addChild(line.stageChild);
    lines[key] = line;
  }

  return {
    stageChildren: [container, mask],
    update: memoizeOne(({
      canvasWidth,
      x,
      y,
      width,
      height,
      maxValue
    }) => {
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
          toY: y
        });
      }
    })
  };
}

function makeLine({values, color, width}) {
  const path = new PixiGraphics();

  return {
    stageChild: path,
    update: memoizeOne(({
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

      path.lineStyle(width, parseColorToPixi(color), opacity, 0.5);

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

function parseColorToPixi(color) {
  if (typeof color === 'number') {
    return color;
  }
  return parseInt(color.slice(1), 16);
}
