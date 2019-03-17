import getMaxOnRange from '../helpers/getMaxOnRange';
import drawChartOnCanvas from './drawChartOnCanvas';
import styles from './chart.css?module';

/**
 * Manages one chart with all its controls
 */
export default class Chart {
  /**
   * The unchanged chart data to display
   * @type {{name: string, x: number[], lines: Record<string, {name: string, color: string, values: number[]}>}}
   */
  chartData;

  /**
   * The mutable chart data to display
   * @type {{startX: number, endX: number, lines: Record<string, {enabled: boolean}>}}
   */
  chartState;

  /**
   * The chart canvas element
   * @type {HTMLCanvasElement}
   */
  canvas;

  /**
   * The line toggle buttons
   * @type {Record<string, HTMLButtonElement>}
   */
  lineToggles;

  /**
   * Id of the current animation frame request
   * @type {number|null}
   */
  animationFrameId = null;

  /**
   * The device pixel ratio (number of real pixels per CSS pixel)
   * @type {number}
   */
  pixelRatio = 1;

  /**
   * @param {HTMLElement} domElement Where to render the chart
   * @param {{}} chartData The data to display
   */
  constructor(domElement, chartData) {
    this.chartData = chartData;

    const linesState = {};
    for (const key of Object.keys(chartData.lines)) {
      linesState[key] = {
        enabled: true
      }
    }

    this.chartState = {
      startX: (chartData.x.length - 1) * 0.73,
      endX: chartData.x.length - 1,
      lines: linesState
    };

    const {root, canvas, toggles} = createDOM(chartData.name, chartData.lines);
    this.canvas = canvas;
    this.lineToggles = toggles;

    domElement.appendChild(root);
    for (const [key, toggle] of Object.entries(toggles)) {
      toggle.addEventListener('click', event => {
        event.preventDefault();
        this.toggleLine(key);
      });
    }

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  /**
   * Schedules a view render on the next animation frame
   */
  renderOnNextAnimationFrame() {
    if (this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.render();
    });
  }

  /**
   * Turns a line on or off
   *
   * @param {string} key
   */
  toggleLine(key) {
    this.chartState.lines[key].enabled = !this.chartState.lines[key].enabled;
    this.renderOnNextAnimationFrame();
  }

  /**
   * Handles a window resize event
   */
  handleResize = () => {
    this.pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * this.pixelRatio;
    this.canvas.height = this.canvas.clientHeight * this.pixelRatio;

    this.renderOnNextAnimationFrame();
  };

  /**
   * Updates the chart view
   */
  render() {
    const [canvasDrawData, needsUpdateOnNextFrame] = this.getCanvasDrawData();
    drawChartOnCanvas(this.canvas, canvasDrawData);
    this.updateListToggles();

    if (needsUpdateOnNextFrame) {
      this.renderOnNextAnimationFrame();
    }
  }

  updateListToggles() {
    for (const [key, {enabled}] of Object.entries(this.chartState.lines)) {
      const toggle = this.lineToggles[key];
      if (!toggle) {
        continue;
      }
      if (enabled) {
        if (!toggle.classList.contains(styles.on)) {
          toggle.classList.add(styles.on);
        }
      } else {
        if (toggle.classList.contains(styles.on)) {
          toggle.classList.remove(styles.on);
        }
      }
    }
  }

  /**
   * Converts the current chart data and state to data for the canvas drawer
   */
  getCanvasDrawData() {
    const linesDataEntries = Object.entries(this.chartData.lines);

    const maxY = Math.max(...linesDataEntries.map(([key, {values}]) => {
      return this.chartState.lines[key].enabled
        ? getMaxOnRange(values, this.chartState.startX, this.chartState.endX)
        : 0;
    }));

    const mapMaxY = Math.max(...linesDataEntries.map(([key, {values}]) => {
      return this.chartState.lines[key].enabled
        ? Math.max(...values)
        : 0;
    }));

    return [{
      pixelRatio: this.pixelRatio,
      minX: this.chartState.startX,
      maxX: this.chartState.endX,
      minY: 0,
      maxY: maxY || 1,
      mapMinY: 0,
      mapMaxY,
      dates: this.chartData.x,
      lines: linesDataEntries.map(([key, {color, values}]) => ({
        color,
        values,
        opacity: this.chartState.lines[key].enabled ? 1 : 0
      }))
    }, false];
  }
}

/**
 * Creates the cart DOM
 *
 * @param {string} name
 * @param {{}} lines
 * @returns {{canvas: HTMLElement, root: HTMLElement, toggles: Record<string, HTMLElement>}}
 */
function createDOM(name, lines) {
  const rootElement = document.createElement('div');
  rootElement.className = styles.root;

  const nameElement = document.createElement('h3');
  nameElement.textContent = name;
  nameElement.className = styles.name;
  rootElement.appendChild(nameElement);

  const canvas = document.createElement('canvas');
  canvas.className = styles.canvas;
  rootElement.appendChild(canvas);

  const toggles = {};
  const togglesBox = document.createElement('div');
  togglesBox.className = styles.toggles;
  rootElement.appendChild(togglesBox);

  for (const [key, {name, color}] of Object.entries(lines)) {
    const toggle = document.createElement('button');
    toggle.className = styles.toggle;
    toggles[key] = toggle;
    togglesBox.appendChild(toggle);

    const icon = document.createElement('span');
    icon.className = styles.toggleIcon;
    icon.style.backgroundColor = icon.style.borderColor = color;
    toggle.appendChild(icon);

    const nameElement = document.createElement('span');
    nameElement.textContent = name;
    nameElement.className = styles.toggleName;
    toggle.appendChild(nameElement);
  }

  return {root: rootElement, canvas, toggles};
}
