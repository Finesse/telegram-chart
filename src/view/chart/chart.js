import memoizeOne from 'memoize-one';
import {quadOut} from 'd3-ease/src/quad';
import {
  makeAnimationGroup,
  makeExponentialTransition,
  makeInstantWhenHiddenTransition,
  makeTransition
} from '../../helpers/animationGroup';
import {getMinAndMaxOnRange} from '../../helpers/data';
import {getDateComponentsForRange} from '../../helpers/date';
import {getDateNotchScale, getValueRangeAndNotchScale} from '../../helpers/scale';
import {themeTransitionDuration, chartMapHeight, chartMapBottom, chartSidePadding} from '../../style';
import makeToggleButton from '../toggleButton/toggleButton';
import makeColumnDetails from '../columnDetails/columnDetails';
import makeSafariAssKicker from '../safariAssKicker/safariAssKicker';
import watchGestures from './watchGestures';
import styles from './chart.css?module';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 5;

const template = `
<section class="${styles.root}">
  <h3 class="${styles.name}"></h3>
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
 * @todo Try to optimize the theme switch by not animating the charts that are not visible
 */
export default function makeChart(element, {name, dates, lines}, initialTheme = 'day') {
  // The arguments store the unaltered chart state

  const linesMinAndMax = getLinesMinAndMaxValues(lines);

  /**
   * Stores the plain not animated chart state
   */
  const state = getInitialState(lines, dates, initialTheme);

  /**
   * Stores the animated chart state
   */
  const transitions = createTransitionGroup(lines, dates, state, linesMinAndMax, updateView);

  // Creating a DOM and a WebGL renderer
  const {
    chartBox,
    mainCanvas,
    mapCanvas,
    setDetailsState,
    setTogglesState,
    kickSafariAss
  } = createDOM(element, name, lines, dates, state.lines, handleToggleLine, handleLineToggleOther);
  const updateCanvases = makeChartDrawer(mainCanvas, mapCanvas, lines, dates);
  const gesturesWatcher = watchGestures(chartBox, getStateForGestureWatcher(dates, state.startIndex, state.endIndex), {
    mapSelectorStart: handleStartIndexChange,
    mapSelectorMiddle: handleIndexMove,
    mapSelectorEnd: handleEndIndexChange,
    detailsPosition: handleDetailsPositionChange
  });

  function handleToggleLine(key) {
    const {lines} = state;

    setState({
      lines: {
        ...lines,
        [key]: {
          ...lines[key],
          enabled: !lines[key].enabled
        }
      }
    });
  }

  function handleLineToggleOther(leaveKey) {
    const {lines} = state;
    const newLinesState = {};
    const enableAll = areAllLinesExceptOneDisabled(lines, leaveKey);

    for (const key of Object.keys(lines)) {
      newLinesState[key] = {
        ...lines[key],
        enabled: enableAll || key === leaveKey
      };
    }

    setState({ ...state, lines: newLinesState });
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

    applyMapValueRange(linesMinAndMax, state.lines);
    applyLinesOpacity(state.lines);
    applyMainValueRange(lines, state.lines, state.startIndex, state.endIndex);
    applyDatesRange(dates, state.startIndex, state.endIndex);
    applyDetailsPosition(state.detailsScreenPosition, state.startIndex, state.endIndex);
    applyTheme(state.theme);

    transitions.updateOnNextFrame();
  }

  const applyMapValueRange = memoizeOne((linesMinAndMax, linesState) => {
    const {min, max} = getMapMinAndMaxValue(linesMinAndMax, linesState);

    // Don't shrink the chart when all the lines are disabled
    if (min < max) {
      transitions.setTargets({
        mapMinValue: min,
        mapMaxValue: max
      });
    }
  });

  const applyLinesOpacity = memoizeOne(linesState => {
    for (const [key, {enabled}] of Object.entries(linesState)) {
      transitions.setTargets({[`line_${key}_opacity`]: enabled ? 1 : 0});
    }
  });

  const applyMainValueRange = memoizeOne((linesData, linesState, startIndex, endIndex) => {
    const {min, max} = getMainMinAndMaxValue(linesData, linesState, startIndex, endIndex);

    // Don't shrink the chart when all the lines are disabled
    if (min < max) {
      const {min: mainMinValue, max: mainMaxValue, notchScale: mainValueNotchScale} = getValueRangeAndNotchScale(min, max);

      transitions.setTargets({
        mainMinValue,
        mainMaxValue,
        mainValueNotchScale
      });
    }
  });

  const applyDatesRange = memoizeOne((dates, startIndex, endIndex) => {
    const startDate = getDataDateComponentsForRange(dates, startIndex);
    const endDate = getDataDateComponentsForRange(dates, endIndex);

    transitions.setTargets({
      dateNotchScale: getDateNotchScale(endIndex - startIndex),
      rangeStartDay: startDate.day,
      rangeStartMonth: startDate.month,
      rangeStartYear: startDate.year,
      rangeEndDay: endDate.day,
      rangeEndMonth: endDate.month,
      rangeEndYear: endDate.year,
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
      lines: linesState
    } = state;

    const {
      mapMinValue,
      mapMaxValue,
      mainMinValue,
      mainMaxValue,
      mainValueNotchScale,
      dateNotchScale,
      detailsScreenPosition: [detailsScreenPosition, detailsOpacity],
      theme,
      rangeStartDay,
      rangeStartMonth,
      rangeStartYear,
      rangeEndDay,
      rangeEndMonth,
      rangeEndYear,
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
      mapMinValue,
      mapMaxValue,
      mainMinValue,
      mainMaxValue,
      mainValueNotchScale,
      dateNotchScale,
      startIndex,
      endIndex,
      detailsIndex,
      detailsOpacity,
      rangeStartDay,
      rangeStartMonth,
      rangeStartYear,
      rangeEndDay,
      rangeEndMonth,
      rangeEndYear,
      theme
    }, linesOpacity);

    setDetailsState(detailsScreenPosition, detailsOpacity, Math.round(detailsIndex), linesState);

    setTogglesState(linesState);

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
function createTransitionGroup(lines, dates, {startIndex, endIndex, theme, lines: linesState}, linesMinAndMax, onUpdate) {
  const {min: mapMinValue, max: mapMaxValue} = getMapMinAndMaxValue(linesMinAndMax, linesState);
  const {min: mainMinRawValue, max: mainMaxRawValue} = getMainMinAndMaxValue(lines, linesState, startIndex, endIndex);
  const {min: mainMinValue, max: mainMaxValue, notchScale: mainValueNotchScale} = getValueRangeAndNotchScale(mainMinRawValue, mainMaxRawValue);
  const startDate = getDataDateComponentsForRange(dates, startIndex);
  const endDate = getDataDateComponentsForRange(dates, endIndex);

  const transitions = {
    mapMinValue: makeExponentialTransition(mapMinValue),
    mapMaxValue: makeExponentialTransition(mapMaxValue),
    mainMinValue: makeExponentialTransition(mainMinValue),
    mainMaxValue: makeExponentialTransition(mainMaxValue),
    mainValueNotchScale: makeTransition(mainValueNotchScale),
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
    rangeStartDay: makeTransition(startDate.day, { easing: quadOut }),
    rangeStartMonth: makeTransition(startDate.month, { easing: quadOut }),
    rangeStartYear: makeTransition(startDate.year, { easing: quadOut }),
    rangeEndDay: makeTransition(endDate.day, { easing: quadOut }),
    rangeEndMonth: makeTransition(endDate.month, { easing: quadOut }),
    rangeEndYear: makeTransition(endDate.year, { easing: quadOut }),
    theme: makeTransition(theme === 'day' ? 0 : 1, {duration: themeTransitionDuration}),
  };

  for (const [key, {enabled}] of Object.entries(linesState)) {
    transitions[`line_${key}_opacity`] = makeTransition(enabled ? 1 : 0);
  }

  return makeAnimationGroup(transitions, onUpdate);
}

/**
 * Returns the maximum value of the data on the map
 */
function getMapMinAndMaxValue(linesMinAndMax, linesState) {
  let totalMin = Infinity;
  let totalMax = -Infinity;

  for (const [key, {min, max}] of Object.entries(linesMinAndMax)) {
    if (linesState[key].enabled) {
      if (min < totalMin) {
        totalMin = min;
      }
      if (max > totalMax) {
        totalMax = max;
      }
    }
  }

  return {min: totalMin, max: totalMax};
}

/**
 * Returns the maximum value of the data on the main chart
 */
function getMainMinAndMaxValue(linesData, linesState, startIndex, endIndex) {
  let totalMin = Infinity;
  let totalMax = -Infinity;

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      if (linesState[key].enabled) {
        const {min, max} = getMinAndMaxOnRange(linesData[key].values, startIndex, endIndex);
        if (min < totalMin) {
          totalMin = min;
        }
        if (max > totalMax) {
          totalMax = max;
        }
      }
    }
  }

  return {min: totalMin, max: totalMax};
}

function getLinesMinAndMaxValues(lines) {
  const result = {};

  for (const [key, {values}] of Object.entries(lines)) {
    result[key] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  return result;
}

/**
 * Creates the chart DOM
 */
function createDOM(root, name, linesData, dates, linesState, onLineToggle, onLineToggleOther) {
  root.innerHTML = template;
  root.querySelector(`.${styles.name}`).textContent = name;

  const nameBox = root.querySelector(`.${styles.name}`);
  nameBox.textContent = name;

  const columnDetails = makeColumnDetails(linesData, dates, styles.details);
  const chartBox = root.querySelector(`.${styles.chart}`);
  chartBox.appendChild(columnDetails.element);

  const togglesBox = root.querySelector(`.${styles.toggles}`);
  const togglesStateSetters = {};
  for (const [key, {color, name}] of Object.entries(linesData)) {
    const {element, setState} = makeToggleButton(
      color,
      name,
      () => onLineToggle(key),
      () => onLineToggleOther(key),
      styles.toggle
    );
    togglesStateSetters[key] = setState;
    togglesBox.appendChild(element);
  }
  const setTogglesState = memoizeOne(linesState => {
    for (const key of Object.keys(linesState)) {
      togglesStateSetters[key](linesState[key].enabled);
    }
  });
  setTogglesState(linesState);

  const {element: safariAssKickerElement, kick: kickSafariAss} = makeSafariAssKicker();
  root.appendChild(safariAssKickerElement);

  return {
    chartBox,
    mainCanvas: root.querySelector(`.${styles.mainCanvas}`),
    mapCanvas: root.querySelector(`.${styles.mapCanvas}`),
    setDetailsState: columnDetails.setState,
    setTogglesState,
    kickSafariAss
  };
}

function getStateForGestureWatcher(dates, startIndex, endIndex) {
  return {
    mapSelectorStart: startIndex / ((dates.length - 1) || 1),
    mapSelectorEnd: endIndex / ((dates.length - 1) || 1)
  };
}

function getDataDateComponentsForRange(dates, index) {
  const timestamp = dates[Math.max(0, Math.min(Math.round(index), dates.length - 1))];
  return getDateComponentsForRange(timestamp);
}

function areAllLinesExceptOneDisabled(linesState, theKey) {
  for (const [key, {enabled}] of Object.entries(linesState)) {
    if (key === theKey && !enabled || key !== theKey && enabled) {
      return false;
    }
  }

  return true;
}
