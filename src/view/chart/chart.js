import memoizeOne from 'memoize-one';
import {quadOut} from 'd3-ease/src/quad';
import {
  makeAnimationGroup,
  makeExponentialTransition,
  makeInstantWhenHiddenTransition,
  makeTransition
} from '../../helpers/animationGroup';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import {formatDate} from '../../helpers/date';
import {themeTransitionDuration, chartMapHeight, chartMapBottom, chartSidePadding} from '../../style';
import makeToggleButton from '../toggleButton/toggleButton';
import makeColumnDetails from '../columnDetails/columnDetails';
import makeRotatingDisplay from '../rotatingDisplay/rotatingDisplay';
import makeSafariAssKicker from '../safariAssKicker/safariAssKicker';
import watchGestures from './watchGestures';
import styles from './chart.css?module';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 5;

const template = `
<section class="${styles.root}">
  <header class="${styles.header}">
    <h3 class="${styles.name}"></h3>
    <div class="${styles.range}"></div>
  </header>
  <div class="${styles.chart}">
    <canvas class="${styles.mapCanvas}" style="left: ${chartSidePadding}px; bottom: ${chartMapBottom}px; width: calc(100% - ${chartSidePadding * 2}px); height: ${chartMapHeight}px;"></canvas>
    <canvas class="${styles.mainCanvas}"></canvas>
  </div>
  <div class="${styles.toggles}"></div>
</section>
`;

/**
 * Draws and operates one chart
 *
 * @todo Round the elements positions considering the device pixel density
 * @todo Try to optimize the theme switch by not animating the charts that are not visible
 * @todo Cache the lines max values
 */
export default function makeChart(element, {name, dates, lines}, initialTheme = 'day') {
  // The arguments store the unaltered chart state

  /**
   * Stores the plain not animated chart state
   */
  const state = getInitialState(lines, dates, initialTheme);

  /**
   * Stores the animated chart state
   */
  const transitions = createTransitionGroup(
    state,
    getMapMaxValue(lines, state.lines),
    getMainMaxValue(lines, state.lines, state.startIndex, state.endIndex),
    state.theme,
    updateView
  );

  // Creating a DOM and a WebGL renderer
  const {
    chartBox,
    mainCanvas,
    mapCanvas,
    setRangeStartDateIndex,
    setDetailsState,
    kickSafariAss
  } = createDOM(element, name, lines, dates, state.lines, handleToggleLine);
  const updateCanvases = makeChartDrawer(mainCanvas, mapCanvas, lines, dates);
  const gesturesWatcher = watchGestures(chartBox, getStateForGestureWatcher(dates, state.startIndex, state.endIndex), {
    mapSelectorStart: handleStartIndexChange,
    mapSelectorMiddle: handleIndexMove,
    mapSelectorEnd: handleEndIndexChange,
    detailsPosition: handleDetailsPositionChange
  });

  function handleToggleLine(key, enabled) {
    const {lines} = state;

    setState({
      lines: {...lines, [key]: {...lines[key], enabled}}
    });
  }

  function handleWindowResize() {
    setState({
      mainCanvasWidth: mainCanvas.clientWidth,
      mainCanvasHeight: mainCanvas.clientHeight,
      mapCanvasWidth: mapCanvas.clientWidth,
      mapCanvasHeight: mapCanvas.clientHeight,
      pixelRatio: window.devicePixelRatio || 1
    });
  }

  function handleStartIndexChange(relativeIndex) {
    const x = relativeIndex * (dates.length - 1);
    const startIndex = Math.max(0, Math.min(x, (dates.length - 1) - minMapSelectionLength));
    const endIndex = Math.max(state.endIndex, startIndex + minMapSelectionLength);

    setState({startIndex, endIndex});
  }

  function handleEndIndexChange(relativeIndex) {
    const x = relativeIndex * (dates.length - 1);
    const endIndex = Math.max(minMapSelectionLength, Math.min(x, dates.length - 1));
    const startIndex = Math.min(state.startIndex, endIndex - minMapSelectionLength);

    setState({startIndex, endIndex});
  }

  function handleIndexMove(relativeMiddleX) {
    const x = relativeMiddleX * (dates.length - 1);
    const currentXLength = state.endIndex - state.startIndex;
    const startIndex = Math.min(Math.max(0, x - currentXLength / 2), (dates.length - 1) - currentXLength);
    const endIndex = startIndex + currentXLength;

    setState({startIndex, endIndex});
  }

  function handleDetailsPositionChange(relativeX) {
    setState({detailsScreenPosition: relativeX});
  }

  /**
   * Every state change must come here. This function decides what to update when the state changes.
   *
   * Data flow:
   * event -> setState -> transitions -> updateView
   */
  function setState(newState) {
    Object.assign(state, newState);

    applyMapMaxValue(lines, state.lines);
    applyLinesOpacity(state.lines);
    applyMainMaxValue(lines, state.lines, state.startIndex, state.endIndex);
    applyDatesRange(dates, state.startIndex, state.endIndex);
    applyDetailsPosition(state.detailsScreenPosition, state.startIndex, state.endIndex);
    applyTheme(state.theme);

    transitions.updateOnNextFrame();
  }

  const applyMapMaxValue = memoizeOne((linesData, linesState) => {
    const mapMaxValue = getMapMaxValue(linesData, linesState);
    if (mapMaxValue > 0) {
      // Don't shrink the chart when all the lines are disabled
      transitions.setTargets({mapMaxValue});
    }
  });

  const applyLinesOpacity = memoizeOne(linesState => {
    for (const [key, {enabled}] of Object.entries(linesState)) {
      transitions.setTargets({[`line_${key}_opacity`]: enabled ? 1 : 0});
    }
  });

  const applyMainMaxValue = memoizeOne((linesData, linesState, startIndex, endIndex) => {
    const mainMaxValue = getMainMaxValue(linesData, linesState, startIndex, endIndex);
    if (mainMaxValue > 0) {
      // Don't shrink the chart when all the lines are disabled
      transitions.setTargets({
        mainMaxValue,
        mainMaxValueNotchScale: maxValueToNotchScale(mainMaxValue)
      });
    }
  });

  const applyDatesRange = memoizeOne((dates, startIndex, endIndex) => {
    transitions.setTargets({
      dateNotchScale: getDateNotchScale(endIndex - startIndex)
    });

    gesturesWatcher.setChartState(getStateForGestureWatcher(dates, startIndex, endIndex));
  });

  const applyDetailsPosition = memoizeOne((detailsScreenPosition, startIndex, endIndex) => {
    if (detailsScreenPosition === null || startIndex === endIndex) {
      transitions.setTargets({
        detailsScreenPosition: [undefined, 0]
      });
      return;
    }

    const indexRange = endIndex - startIndex;
    const detailsIndex = Math.max(0, Math.min(Math.round(startIndex + detailsScreenPosition * indexRange), dates.length - 1));

    transitions.setTargets({
      detailsScreenPosition: [(detailsIndex - startIndex) / indexRange, 1]
    });
  });

  const applyTheme = memoizeOne(theme => {
    transitions.setTargets({
      theme: theme === 'day' ? 0 : 1
    });
  });

  /**
   * Applies the current dist chart state to the chart
   */
  function updateView() {
    const {
      startIndex,
      endIndex,
      mainCanvasWidth,
      mainCanvasHeight,
      mapCanvasWidth,
      mapCanvasHeight,
      pixelRatio,
      lines: linedState
    } = state;

    const {
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      detailsScreenPosition: [detailsScreenPosition, detailsOpacity],
      theme,
      ...linesAnimatedState
    } = transitions.getState();

    const linesOpacity = {};
    for (const key of Object.keys(lines)) {
      linesOpacity[key] = linesAnimatedState[`line_${key}_opacity`];
    }

    const detailsIndex = startIndex + detailsScreenPosition * (endIndex - startIndex);

    updateCanvases({
      mainCanvasWidth: mainCanvasWidth * pixelRatio,
      mainCanvasHeight: mainCanvasHeight * pixelRatio,
      mapCanvasWidth: mapCanvasWidth * pixelRatio,
      mapCanvasHeight: mapCanvasHeight * pixelRatio,
      pixelRatio,
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      startIndex,
      endIndex,
      detailsIndex,
      detailsOpacity,
      theme
    }, linesOpacity);

    // setRangeStartDateIndex(startIndex);

    // setMapSelectorState(startIndex, endIndex, mapCanvasWidth);

    setDetailsState(detailsScreenPosition, detailsOpacity, Math.round(detailsIndex), linedState);

    kickSafariAss();
  }

  return {
    start() {
      window.addEventListener('resize', handleWindowResize);
      handleWindowResize();
    },
    setTheme(theme) {
      setState({theme});
    }
  }
};

/**
 * Makes the initial mutable not animatable state of the chart
 */
function getInitialState(lines, dates, theme) {
  const linesState = {};
  for (const key of Object.keys(lines)) {
    linesState[key] = {
      enabled: true
    }
  }

  return {
    mainCanvasWidth: 0,
    mainCanvasHeight: 0,
    mapCanvasWidth: 0,
    mapCanvasHeight: 0,
    pixelRatio: 1,
    startIndex: Math.max((dates.length - 1) * 0.73, dates.length - 1000),
    endIndex: (dates.length - 1),
    lines: linesState,
    detailsScreenPosition: null,
    theme
  }
}

/**
 * Makes the animatable state of the chart
 */
function createTransitionGroup({startIndex, endIndex, lines}, mapMaxValue, mainMaxValue, theme, onUpdate) {
  const transitions = {
    mapMaxValue: makeExponentialTransition(mapMaxValue),
    mainMaxValue: makeExponentialTransition(mainMaxValue),
    mainMaxValueNotchScale: makeTransition(maxValueToNotchScale(mainMaxValue)),
    dateNotchScale: makeTransition(getDateNotchScale(endIndex - startIndex), {
      maxDistance: 1.5
    }),
    detailsScreenPosition: makeInstantWhenHiddenTransition(
      makeTransition(0.5, {
        easing: quadOut,
        duration: 300
      }),
      makeTransition(0, {
        duration: 300
      })
    ),
    theme: makeTransition(theme === 'day' ? 0 : 1, {duration: themeTransitionDuration}),
  };

  for (const [key, {enabled}] of Object.entries(lines)) {
    transitions[`line_${key}_opacity`] = makeTransition(enabled ? 1 : 0);
  }

  return makeAnimationGroup(transitions, onUpdate);
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

/**
 * Returns the maximum value of the data on the map
 */
function getMapMaxValue(linesData, linesState) {
  const linesEntries = Object.entries(linesData);

  return Math.max(0, ...linesEntries.map(([key, {values}]) => {
    return linesState[key].enabled
      ? Math.max(...values)
      : 0;
  }));
}

/**
 * Returns the maximum value of the data on the main chart
 */
function getMainMaxValue(linesData, linesState, startIndex, endIndex) {
  const linesEntries = Object.entries(linesData);

  return Math.max(0, ...linesEntries.map(([key, {values}]) => {
    return linesState[key].enabled
      ? getMaxOnRange(values, startIndex, endIndex)
      : 0;
  }));
}

/**
 * Creates the chart DOM
 */
function createDOM(root, name, linesData, dates, linesState, onToggle) {
  root.innerHTML = template;
  root.querySelector(`.${styles.name}`).textContent = name;

  const nameBox = root.querySelector(`.${styles.name}`);
  nameBox.textContent = name;

  function formatRangeDate(index) {
    if (index < 0 || index > dates.length - 1) {
      return '';
    }
    return formatDate(dates[index]);
  }

  const rangeBox = root.querySelector(`.${styles.range}`);
  const {element: rangeStartElement, setPosition: setRangeStartDateIndex} = makeRotatingDisplay(formatRangeDate, 1, 1);
  rangeBox.appendChild(rangeStartElement);

  const columnDetails = makeColumnDetails(linesData, dates, styles.details);
  const chartBox = root.querySelector(`.${styles.chart}`);
  chartBox.appendChild(columnDetails.element);

  const togglesBox = root.querySelector(`.${styles.toggles}`);
  for (const [key, {color, name}] of Object.entries(linesData)) {
    togglesBox.appendChild(makeToggleButton(
      color,
      name,
      linesState[key].enabled,
      enabled => onToggle(key, enabled),
      styles.toggle
    ));
  }

  const {element: safariAssKickerElement, kick: kickSafariAss} = makeSafariAssKicker();
  root.appendChild(safariAssKickerElement);

  return {
    chartBox,
    mainCanvas: root.querySelector(`.${styles.mainCanvas}`),
    mapCanvas: root.querySelector(`.${styles.mapCanvas}`),
    setRangeStartDateIndex,
    setDetailsState: columnDetails.setState,
    kickSafariAss
  };
}

function getStateForGestureWatcher(dates, startIndex, endIndex) {
  return {
    mapSelectorStart: startIndex / ((dates.length - 1) || 1),
    mapSelectorEnd: endIndex / ((dates.length - 1) || 1)
  };
}
