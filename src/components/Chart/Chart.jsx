import {Component, createRef} from 'inferno';
import {chartSidePadding, chartMapHeight} from '../../style';
import ToggleButton from '../ToggleButton/ToggleButton';
import ChartMapLines from '../ChartMapLines';
import ChartTopFade from '../ChartTopFade/ChartTopFade';
import ChartMainSection from '../ChartMainSection/ChartMainSection';
import ChartMapSelector from '../ChartMapSelector/ChartMapSelector';
import GestureRecognizer from './GestureRecognizer';
import styles from './Chart.css?module';

const minMapSelectionLength = 2;

// todo: Add the toggle icons
// todo: Add the selected column information
// todo: Round the elements positions considering the device pixel density
// todo: Use exponential value for animating the lines maxY
export default class Chart extends Component {
  canvasRef = createRef();

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
    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
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
          <svg
            className={styles.svg}
            viewBox={`0 0 ${this.state.canvasWidth} ${this.state.canvasHeight}`}
            preserveAspectRatio="none"
            shapeRendering={window.devicePixelRatio >= 3 ? 'optimizeSpeed' : 'auto'}
            ref={this.canvasRef}
          >
            {this.state.canvasWidth > 0 && this.state.canvasHeight > 0 && <>
              <ChartMainSection
                canvasWidth={this.state.canvasWidth}
                x={chartSidePadding}
                y={0}
                width={this.state.canvasWidth - chartSidePadding * 2}
                height={this.state.canvasHeight - chartMapHeight}
                startIndex={this.state.startX}
                endIndex={this.state.endX}
                linesData={this.props.lines}
                linesState={this.state.lines}
                dates={this.props.x}
              />
              <ChartMapLines
                canvasWidth={this.state.canvasWidth}
                x={chartSidePadding}
                y={this.state.canvasHeight - chartMapHeight}
                width={this.state.canvasWidth - chartSidePadding * 2}
                height={chartMapHeight}
                linesData={this.props.lines}
                linesState={this.state.lines}
              />
              <ChartMapSelector
                x={chartSidePadding}
                y={this.state.canvasHeight - chartMapHeight}
                width={this.state.canvasWidth - chartSidePadding * 2}
                height={chartMapHeight}
                relativeStart={relativeStartX}
                relativeEnd={relativeEndX}
              />
              <ChartTopFade
                x={0}
                y={0}
                width="100%"
                height={18}
              />
            </>}
          </svg>
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
    this.setState({
      canvasWidth: this.canvasRef.current.clientWidth,
      canvasHeight: this.canvasRef.current.clientHeight
    });
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
