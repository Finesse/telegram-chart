import memoizeOne from 'memoize-one';
import {quadOut} from 'd3-ease/src/quad';
import {cubicOut} from 'd3-ease/src/cubic';
import {
  makeAnimationGroup,
  makeExponentialTransition,
  makeInstantWhenHiddenTransition,
  makeLogarithmicTransition,
  makeTransition,
  makeTransitionGroup
} from '../../helpers/animationGroup';
import {
  getLinesMinAndMaxValues,
  getMaxSumOnRange,
  getMinAndMaxOnRange,
  linesObjectToVectorArray,
  getLinesMinAndMaxOnRange,
  getMinAndMaxFromLinesCache
} from '../../helpers/data';
import {getDateComponentsForRange} from '../../helpers/date';
import {
  getDateNotchScale,
  getValueRangeForFixedNotches,
  getValueRangeForFixedBottom,
  getSubDecimalScale
} from '../../helpers/scale';
import {inRange} from '../../helpers/number';
import {
  themeTransitionDuration,
  chartMapHeight,
  chartMapBottom,
  chartSidePadding,
  chartValueScaleMaxNotchCount,
  chartValue2YScaleNotchCount,
  chartMapCornerRadius,
  chartValueAreaNotchCount
} from '../../style';
import makeToggleButton from '../toggleButton/toggleButton';
import makeSafariAssKicker from '../safariAssKicker/safariAssKicker';
import {TYPE_AREA, TYPE_BAR, TYPE_LINE, TYPE_LINE_TWO_Y} from '../../namespace';
import watchGestures from './watchGestures';
import styles from './chart.css?module';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 5;

// The border-radius style is used here because a round clipping mask in the canvas slows Safari very much
const template = `
<section class="${styles.root}">
  <h3 class="${styles.name}"></h3>
  <div class="${styles.chart}">
    <canvas class="${styles.mapCanvas}" style="left: ${chartSidePadding}px; bottom: ${chartMapBottom}px; width: calc(100% - ${chartSidePadding * 2}px); height: ${chartMapHeight}px; border-radius: ${chartMapCornerRadius}px;"></canvas>
    <canvas class="${styles.mainCanvas}"></canvas>
  </div>
  <div class="${styles.toggles}"></div>
</section>
`;

/**
 * Draws and operates one chart
 *
 * @todo Try to optimize the theme switch by not animating the charts that are not visible
 * @todo Use classes and inheritance for different types of chart
 */
export default function makeChart(element, {name, type, dates, lines}, initialTheme = 'day') {
  // The arguments store the unaltered chart state

  const linesMinAndMax = type === TYPE_LINE || type === TYPE_LINE_TWO_Y ? getLinesMinAndMaxValues(lines) : {};

  const minIndex = type === TYPE_BAR ? -0.5 : 0;
  const maxIndex = dates.length - (type === TYPE_BAR ? 0.5 : 1);

  /**
   * Stores the plain not animated chart state
   */
  const state = getInitialState(lines, minIndex, maxIndex, initialTheme);

  /**
   * Stores the animated chart state
   */
  const transitions = createTransitionGroup({type, lines, dates, state, linesMinAndMax, onUpdate: updateView});

  // Creating a DOM and a WebGL renderer
  const {
    chartBox,
    mainCanvas,
    mapCanvas,
    setTogglesState,
    kickSafariAss
  } = createDOM(element, name, lines, dates, state.lines, handleToggleLine, handleLineToggleOther);
  const updateCanvases = makeChartDrawer(mainCanvas, mapCanvas, type, lines, dates, minIndex, maxIndex);
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
    const x = minIndex + relativeIndex * (maxIndex - minIndex);
    const startIndex = inRange(minIndex, x, maxIndex - minMapSelectionLength);
    const endIndex = Math.max(state.endIndex, startIndex + minMapSelectionLength);

    setState({startIndex, endIndex});
  }

  function handleEndIndexChange(relativeIndex) {
    const x = minIndex + relativeIndex * (maxIndex - minIndex);
    const endIndex = inRange(minIndex + minMapSelectionLength, x, maxIndex);
    const startIndex = Math.min(state.startIndex, endIndex - minMapSelectionLength);

    setState({startIndex, endIndex});
  }

  function handleIndexMove(relativeMiddleX) {
    const x = minIndex + relativeMiddleX * (maxIndex - minIndex);
    const currentXLength = state.endIndex - state.startIndex;
    const startIndex = inRange(minIndex, x - currentXLength / 2, maxIndex - currentXLength);
    const endIndex = startIndex + currentXLength;

    setState({startIndex, endIndex});
  }

  function handleDetailsPositionChange(relativeX) {
    if (relativeX === null) {
      setState({detailsIndex: null});
    } else {
      const index = state.startIndex + (state.endIndex - state.startIndex) * relativeX;
      setState({
        detailsIndex: inRange(0, Math.round(index), dates.length - 1)
      });
    }
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
    applyDatesRange(dates, minIndex, maxIndex, state.startIndex, state.endIndex);
    applyDetailsPosition(state.detailsIndex, state.startIndex, state.endIndex);
    applyTheme(state.theme);

    transitions.updateOnNextFrame();
  }

  const applyMapValueRange = memoizeOne((linesMinAndMax, linesState) => {
    switch (type) {
      case TYPE_LINE: {
        const {min, max} = getMinAndMaxFromLinesCache(linesMinAndMax, linesState);

        // Don't shrink the chart when all the lines are disabled
        if (isFinite(min) && isFinite(max)) {
          transitions.setTargets({
            mapMinValue: min,
            mapMaxValue: max
          });
        }
        break;
      }
      case TYPE_BAR: {
        const maxSum = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), 0, Infinity);

        if (maxSum > 0) {
          transitions.setTargets({
            mapMaxValue: maxSum
          });
        }
      }
    }
  });

  const applyLinesOpacity = memoizeOne(linesState => {
    const linesOpacity = {};
    for (const key in linesState) {
      if (linesState.hasOwnProperty(key)) {
        linesOpacity[key] = linesState[key].enabled ? 1 : 0;
      }
    }

    transitions.setTargets({linesOpacity});
  });

  const applyMainValueRange = memoizeOne((linesData, linesState, startIndex, endIndex) => {
    switch (type) {
      case TYPE_LINE: {
        const {min, max} = getLinesMinAndMaxOnRange(linesData, linesState, startIndex, endIndex);

        // Don't shrink the chart when all the lines are disabled
        if (isFinite(min) && isFinite(max)) {
          const minMax = getValueRangeForFixedBottom(min, max, chartValueScaleMaxNotchCount);

          transitions.setTargets({
            mainMinValue: minMax.min,
            mainMaxValue: minMax.max,
            mainValueNotchScale: minMax.notchScale
          });
        }
        break;
      }
      case TYPE_LINE_TWO_Y: {
        const [mainLineKey, altLineKey] = Object.keys(lines);
        const rawMinMax = getMinAndMaxOnRange(lines[mainLineKey].values, startIndex, endIndex);
        const minMax = getValueRangeForFixedNotches(rawMinMax.min, rawMinMax.max, chartValue2YScaleNotchCount);
        const rawAltMinMax = getMinAndMaxOnRange(lines[altLineKey].values, startIndex, endIndex);
        const altMinMax = getValueRangeForFixedNotches(rawAltMinMax.min, rawAltMinMax.max, chartValue2YScaleNotchCount);

        transitions.setTargets({
          mainMinValue: minMax.min,
          mainMaxValue: minMax.max,
          mainValueNotchScale: minMax.notchScale,
          mainAltMinValue: altMinMax.min,
          mainAltMaxValue: altMinMax.max,
          mainAltValueNotchScale: altMinMax.notchScale
        });
        break;
      }
      case TYPE_BAR: {
        const maxSum = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), startIndex, endIndex);
        const minMax = getValueRangeForFixedBottom(0, maxSum, chartValueScaleMaxNotchCount);

        if (maxSum > 0) {
          transitions.setTargets({
            mainMinValue: minMax.min,
            mainMaxValue: minMax.max,
            mainValueNotchScale: minMax.notchScale
          });
        }
      }
    }
  });

  const applyDatesRange = memoizeOne((dates, minIndex, maxIndex, startIndex, endIndex) => {
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

    gesturesWatcher.setChartState(getStateForGestureWatcher(minIndex, maxIndex, startIndex, endIndex));
  });

  const applyDetailsPosition = memoizeOne((detailsIndex, startIndex, endIndex) => {
    if (detailsIndex === null) {
      transitions.setTargets({
        detailsPosition: [undefined, 0]
      });
      return;
    }

    const detailsDate = getDataDateComponentsForRange(dates, detailsIndex);
    const relativePosition = (detailsIndex - startIndex) / (endIndex - startIndex);

    transitions.setTargets({
      detailsPosition: [{
        ...detailsDate,
        index: detailsIndex,
        align: relativePosition > 0.5 ? 0 : 1
      }, 1]
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
      linesOpacity,
      detailsPosition: [
        {
          index: detailsIndex,
          day: detailsDay,
          month: detailsMonth,
          year: detailsYear,
          align: detailsAlign
        },
        detailsOpacity
      ],
      ...restTransitionState
    } = transitions.getState();

    updateCanvases({
      ...restTransitionState,
      mainCanvasWidth: mainCanvasWidth * pixelRatio,
      mainCanvasHeight: mainCanvasHeight * pixelRatio,
      mapCanvasWidth: mapCanvasWidth * pixelRatio,
      mapCanvasHeight: mapCanvasHeight * pixelRatio,
      pixelRatio,
      startIndex,
      endIndex,
      detailsIndex,
      detailsDay,
      detailsMonth,
      detailsYear,
      detailsAlign,
      detailsOpacity
    }, linesOpacity);

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
function getInitialState(lines, minIndex, maxIndex, theme) {
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
    startIndex: minIndex + (maxIndex - minIndex) * 0.73,
    endIndex: maxIndex,
    lines: linesState,
    detailsIndex: null,
    theme
  }
}

/**
 * Makes the animatable state of the chart
 */
function createTransitionGroup({
  type,
  lines,
  dates,
  state: {startIndex, endIndex, theme, lines: linesState},
  linesMinAndMax,
  onUpdate
}) {
  const startDate = getDataDateComponentsForRange(dates, startIndex);
  const endDate = getDataDateComponentsForRange(dates, endIndex);
  let mapMinValue;
  let mapMaxValue;
  let mapAltMinValue;
  let mapAltMaxValue;
  let mainMinValue;
  let mainMaxValue;
  let mainValueNotchScale;
  let mainAltMinValue;
  let mainAltMaxValue;
  let mainAltValueNotchScale;
  let useLinearValueTransition = false;

  switch (type) {
    case TYPE_LINE: {
      const mapMinMax = getMinAndMaxFromLinesCache(linesMinAndMax, linesState);
      mapMinValue = mapMinMax.min;
      mapMaxValue = mapMinMax.max;
      const rawMainMinMax = getLinesMinAndMaxOnRange(lines, linesState, startIndex, endIndex);
      const mainMinMax = getValueRangeForFixedBottom(rawMainMinMax.min, rawMainMinMax.max, chartValueScaleMaxNotchCount);
      mainMinValue = mainMinMax.min;
      mainMaxValue = mainMinMax.max;
      mainValueNotchScale = mainMinMax.notchScale;
      break;
    }
    case TYPE_LINE_TWO_Y: {
      const [mainLineKey, altLineKey] = Object.keys(lines);
      const mapMinMax = linesMinAndMax[mainLineKey];
      mapMinValue = mapMinMax.min;
      mapMaxValue = mapMinMax.max;
      const mapAltMinMax = linesMinAndMax[altLineKey];
      mapAltMinValue = mapAltMinMax.min;
      mapAltMaxValue = mapAltMinMax.max;
      const mainRawMinMax = getMinAndMaxOnRange(lines[mainLineKey].values, startIndex, endIndex);
      const mainMinMax = getValueRangeForFixedNotches(mainRawMinMax.min, mainRawMinMax.max, chartValue2YScaleNotchCount);
      mainMinValue = mainMinMax.min;
      mainMaxValue = mainMinMax.max;
      mainValueNotchScale = mainMinMax.notchScale;
      const mainAltRawMinMax = getMinAndMaxOnRange(lines[altLineKey].values, startIndex, endIndex);
      const mainAltMinMax = getValueRangeForFixedNotches(mainAltRawMinMax.min, mainAltRawMinMax.max, chartValue2YScaleNotchCount);
      mainAltMinValue = mainAltMinMax.min;
      mainAltMaxValue = mainAltMinMax.max;
      mainAltValueNotchScale = mainAltMinMax.notchScale;
      break;
    }
    case TYPE_BAR: {
      mapMinValue = 0;
      mapMaxValue = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), 0, dates.length - 1);
      const mainMaxSum = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), startIndex, endIndex);
      const mainMinMax = getValueRangeForFixedBottom(0, mainMaxSum, chartValueScaleMaxNotchCount);
      mainMinValue = mainMinMax.min;
      mainMaxValue = mainMinMax.max;
      mainValueNotchScale = mainMinMax.notchScale;
      useLinearValueTransition = true;
      break;
    }
    case TYPE_AREA: {
      mapMinValue = 0;
      mapMaxValue = 100;
      mainMinValue = 0;
      mainMaxValue = 100;
      mainValueNotchScale = getSubDecimalScale(100 / chartValueAreaNotchCount);
      break;
    }
  }

  const valueTransitionFactory = useLinearValueTransition ? makeTransition : makeExponentialTransition;
  const valueNotchScaleTransitionFactory = useLinearValueTransition ? makeLogarithmicTransition : makeTransition;

  const detailsTransitionOptions = {
    easing: cubicOut,
    duration: 300
  };

  const linesOpacityTransitions = {};
  for (const [key, {enabled}] of Object.entries(linesState)) {
    linesOpacityTransitions[key] = makeTransition(enabled ? 1 : 0);
  }

  return makeAnimationGroup({
    linesOpacity: makeTransitionGroup(linesOpacityTransitions),
    mapMinValue: valueTransitionFactory(mapMinValue),
    mapMaxValue: valueTransitionFactory(mapMaxValue),
    mapAltMinValue: valueTransitionFactory(mapAltMinValue),
    mapAltMaxValue: valueTransitionFactory(mapAltMaxValue),
    mainMinValue: valueTransitionFactory(mainMinValue),
    mainMaxValue: valueTransitionFactory(mainMaxValue),
    mainValueNotchScale: valueNotchScaleTransitionFactory(mainValueNotchScale),
    mainAltMinValue: valueTransitionFactory(mainAltMinValue),
    mainAltMaxValue: valueTransitionFactory(mainAltMaxValue),
    mainAltValueNotchScale: valueNotchScaleTransitionFactory(mainAltValueNotchScale),
    dateNotchScale: makeTransition(getDateNotchScale(endIndex - startIndex), {
      maxDistance: 1.5
    }),
    detailsPosition: makeInstantWhenHiddenTransition(
      makeTransitionGroup({
        index: makeTransition(0, detailsTransitionOptions),
        day: makeTransition(0, detailsTransitionOptions),
        month: makeTransition(0, detailsTransitionOptions),
        year: makeTransition(0, detailsTransitionOptions),
        align: makeTransition(0)
      }),
      makeTransition(0, {
        duration: 300
      })
    ),
    rangeStartDay: makeTransition(startDate.day, {easing: quadOut}),
    rangeStartMonth: makeTransition(startDate.month, {easing: quadOut}),
    rangeStartYear: makeTransition(startDate.year, {easing: quadOut}),
    rangeEndDay: makeTransition(endDate.day, {easing: quadOut}),
    rangeEndMonth: makeTransition(endDate.month, {easing: quadOut}),
    rangeEndYear: makeTransition(endDate.year, {easing: quadOut}),
    theme: makeTransition(theme === 'day' ? 0 : 1, {duration: themeTransitionDuration}),
  }, onUpdate);
}

/**
 * Creates the chart DOM
 */
function createDOM(root, name, linesData, dates, linesState, onLineToggle, onLineToggleOther) {
  root.innerHTML = template;
  root.querySelector(`.${styles.name}`).textContent = name;

  const nameBox = root.querySelector(`.${styles.name}`);
  nameBox.textContent = name;

  const togglesBox = root.querySelector(`.${styles.toggles}`);
  let setTogglesState;
  if (Object.keys(linesData).length > 1) {
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

    setTogglesState = memoizeOne(linesState => {
      for (const key of Object.keys(linesState)) {
        togglesStateSetters[key](linesState[key].enabled);
      }
    });
    setTogglesState(linesState);
  } else {
    togglesBox.parentNode.removeChild(togglesBox);
    setTogglesState = () => {};
  }

  const {element: safariAssKickerElement, kick: kickSafariAss} = makeSafariAssKicker();
  root.appendChild(safariAssKickerElement);

  return {
    chartBox: root.querySelector(`.${styles.chart}`),
    mainCanvas: root.querySelector(`.${styles.mainCanvas}`),
    mapCanvas: root.querySelector(`.${styles.mapCanvas}`),
    setTogglesState,
    kickSafariAss
  };
}

function getStateForGestureWatcher(minIndex, maxIndex, startIndex, endIndex) {
  return {
    mapSelectorStart: (startIndex - minIndex) / ((maxIndex - minIndex) || 1),
    mapSelectorEnd: (endIndex - minIndex) / ((maxIndex - minIndex) || 1)
  };
}

function getDataDateComponentsForRange(dates, index) {
  const timestamp = dates[inRange(0, Math.round(index), dates.length - 1)];
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
