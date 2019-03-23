import memoizeOne from 'memoize-one';
import * as PIXI from '../../pixi';
import {makeAnimationGroup, makeTestTransition, makeInstantWhenHiddenTransition} from '../../helpers/animationGroup';
import getMaxOnRange from '../../helpers/getMaxOnRange';
import {themeTransitionDuration, themeTransitionDurationCSS} from '../../style';
import makeToggleButton from '../toggleButton/toggleButton';
import makeColumnDetails from '../columnDetails/columnDetails';
import watchGestures from './watchGestures';
import styles from './chart.css?module';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 2;

const template = `
<div class="${styles.root}">
  <h3 class="${styles.name}"></h3>
  <div class="${styles.chart}">
    <div class="${styles.fade}" style="${themeTransitionDurationCSS}"></div>
    <canvas class="${styles.canvas}"></canvas>
  </div>
  <div class="${styles.toggles}"></div>
</div>
`;

// todo: Round the elements positions considering the device pixel density
// todo: Use exponential value for animating the lines maxY
// todo: Try to optimize the theme switch by not animating the charts that are not visible
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

  const {canvas, setDetailsState} = createDOM(element, name, lines, dates, state.lines, handleToggleLine);
  const {app: pixiApplication, chartDrawer} = createPixiApplication(canvas, lines, dates);
  const gesturesWatcher = watchGestures(canvas, getStateForGestureWatcher(dates, state.startIndex, state.endIndex), {
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
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
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
   * event -> setState -> (updateView, transitions)
   * transitions -> updateView
   */
  function setState(newState) {
    Object.assign(state, newState);

    applyMapMaxValue(lines, state.lines);
    applyLinesOpacity(state.lines);
    applyMainMaxValue(lines, state.lines, state.startIndex, state.endIndex);
    applyDatesRange(dates, state.startIndex, state.endIndex);
    applyDetailsPosition(state.detailsScreenPosition, state.startIndex, state.endIndex);
    applyTheme(state.theme);
    applyCanvasSize(state.canvasWidth, state.canvasHeight, state.pixelRatio);
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

    // It works much smoother if you update on the next frame but not immediately
    transitions.updateOnNextFrame();

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
    /*
      transitions.setTargets({
        theme: theme === 'day' ? 0 : 1
      });
      */
    // Must be called immediately to have a synchronous with CSS render
    updateView();
  });

  const applyCanvasSize = memoizeOne((canvasWidth, canvasHeight, pixelRatio) => {
    pixiApplication.renderer.resolution = pixelRatio;
    pixiApplication.renderer.resize(canvasWidth, canvasHeight);
    transitions.updateOnNextFrame();
  });

  function updateView() {
    const {
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      detailsScreenPosition: [detailsScreenPosition, detailsOpacity],
      // theme,
      ...linesState
    } = transitions.getState();

    const linesOpacity = {};
    for (const key of Object.keys(lines)) {
      linesOpacity[key] = linesState[`line_${key}_opacity`];
    }

    const detailsIndex = state.startIndex + detailsScreenPosition * (state.endIndex - state.startIndex);

    chartDrawer.update({
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      pixelRatio: state.pixelRatio,
      mapMaxValue,
      mainMaxValue,
      mainMaxValueNotchScale,
      dateNotchScale,
      startIndex: state.startIndex,
      endIndex: state.endIndex,
      detailsIndex: detailsIndex,
      detailsOpacity,
      theme: state.theme === 'day' ? 0 : 1
    }, linesOpacity);
    pixiApplication.render();

    setDetailsState(detailsScreenPosition, detailsOpacity, Math.round(detailsIndex));
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


function getInitialState(lines, dates, theme) {
  const linesState = {};
  for (const key of Object.keys(lines)) {
    linesState[key] = {
      enabled: true
    }
  }

  return {
    canvasWidth: 0,
    canvasHeight: 0,
    pixelRatio: 1,
    startIndex: (dates.length - 1) * 0.73,
    endIndex: (dates.length - 1),
    lines: linesState,
    detailsScreenPosition: null,
    theme
  }
}

function createTransitionGroup({startIndex, endIndex, lines}, mapMaxValue, mainMaxValue, theme, onUpdate) {
  const transitions = {
    mapMaxValue: makeTestTransition(mapMaxValue),
    mainMaxValue: makeTestTransition(mainMaxValue),
    mainMaxValueNotchScale: makeTestTransition(maxValueToNotchScale(mainMaxValue)),
    dateNotchScale: makeTestTransition(getDateNotchScale(endIndex - startIndex)),
    detailsScreenPosition: makeInstantWhenHiddenTransition(
      makeTestTransition(0.5),
      makeTestTransition(0)
    ),
    // theme: makeTestTransition(theme === 'day' ? 0 : 1, {duration: themeTransitionDuration}),
  };

  for (const [key, {enabled}] of Object.entries(lines)) {
    transitions[`line_${key}_opacity`] = makeTestTransition(enabled ? 1 : 0);
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

function getMapMaxValue(linesData, linesState) {
  const linesEntries = Object.entries(linesData);

  return Math.max(0, ...linesEntries.map(([key, {values}]) => {
    return linesState[key].enabled
      ? Math.max(...values)
      : 0;
  }));
}

function getMainMaxValue(linesData, linesState, startIndex, endIndex) {
  const linesEntries = Object.entries(linesData);

  return Math.max(0, ...linesEntries.map(([key, {values}]) => {
    return linesState[key].enabled
      ? getMaxOnRange(values, startIndex, endIndex)
      : 0;
  }));
}

function createDOM(root, name, linesData, dates, linesState, onToggle) {
  root.innerHTML = template;
  root.querySelector(`.${styles.name}`).textContent = name;

  const nameBox = root.querySelector(`.${styles.name}`);
  nameBox.textContent = name;

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

  return {
    canvas: root.querySelector(`.${styles.canvas}`),
    setDetailsState: columnDetails.setState
  };
}

function createPixiApplication(canvas, linesData, dates) {
  const app = new PIXI.Application({
    view: canvas,
    autoStart: false,
    antialias: true,
    transparent: true
  });

  const chartDrawer = makeChartDrawer(linesData, dates);
  app.stage.addChild(...chartDrawer.stageChildren);

  return {app, chartDrawer};
}

function getStateForGestureWatcher(dates, startIndex, endIndex) {
  return {
    mapSelectorStart: startIndex / ((dates.length - 1) || 1),
    mapSelectorEnd: endIndex / ((dates.length - 1) || 1)
  };
}
