import {Component, createRef} from 'inferno';
import {chartSidePadding, chartMapHeight} from '../../style';
import ToggleButton from '../ToggleButton/ToggleButton';
import ChartMapLines from '../ChartMapLines';
import ChartTopFade from '../ChartTopFade/ChartTopFade';
import ChartMainSection from '../ChartMainSection/ChartMainSection';
import styles from './Chart.css?module';

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
      startX: (props.x.length - 1) * 0.73,
      endX: props.x.length - 1,
      lines: linesState,
      canvasWidth: 0,
      canvasHeight: 0
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  render() {
    return (
      <div className={styles.root}>
        <h3 className={styles.name}>{this.props.name}</h3>
        <svg
          className={styles.canvas}
          viewBox={`0 0 ${this.state.canvasWidth} ${this.state.canvasHeight}`}
          preserveAspectRatio="none"
          shapeRendering="optimizeSpeed"
          ref={this.canvasRef}
        >
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
          <ChartTopFade
            x={0}
            y={0}
            width="100%"
            height={18}
          />
        </svg>
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
}
