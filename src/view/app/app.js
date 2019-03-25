import {fontFamily, themeTransitionDuration, themeTransitionDurationCSS} from '../../style';
import makeRandomChartData from '../../makeRandomChartData';
import makeChart from '../chart/chart';
import styles from './app.css?module';

const template = `
<div></div>
<div class="${styles.buttonsBlock}">
  <button
    class="${styles.button}"
    style="${themeTransitionDurationCSS}"
    id="showBigData"
  >Show BIG data</button>
  <a
    href="http://github.com/Finesse/telegram-chart"
    target="_blank"
    class="${styles.button}"
    style="${themeTransitionDurationCSS}"
  >See the source code</a>
</div>
<div class="${styles.themeSwitcherHolder}"></div>
<div class="${styles.themeSwitcher}" style="${themeTransitionDurationCSS}">
  <button
    class="${styles.button}"
    style="${themeTransitionDurationCSS}"
  ></button>
</div>
`;

/**
 * Renders and operates the whole application
 */
export default function makeApp(element, chartsData) {
  let theme = 'day';
  const charts = [];

  document.body.style.fontFamily = fontFamily;
  document.body.style.transitionDuration = `${themeTransitionDuration}ms`;
  element.innerHTML = template;
  const themeButton = element.querySelector(`.${styles.themeSwitcher} button`);
  let bigDataButton = element.querySelector('#showBigData');

  function switchTheme() {
    theme = theme === 'day' ? 'night' : 'day';
    applyTheme();
  }

  function applyTheme() {
    const previousClass = `${theme === 'day' ? 'night' : 'day'}Theme`;
    const nextClass = `${theme}Theme`;

    themeButton.textContent = `Switch to ${theme === 'day' ? 'Night' : 'Day'} Mode`;
    document.body.classList.remove(previousClass);
    document.body.classList.add(nextClass);

    for (const chart of charts) {
      chart.setTheme(theme);
    }
  }

  function addChart(chartData, start) {
    const chartBox = document.createElement('div');
    chartBox.className = styles.chart;
    element.firstElementChild.appendChild(chartBox);

    const chart = makeChart(chartBox, chartData, theme);
    if (start) {
      chart.start();
    }

    return chart;
  }

  themeButton.addEventListener('click', event => {
    event.preventDefault();
    switchTheme();
  });
  applyTheme();

  for (const chartData of chartsData) {
    charts.push(addChart(chartData));
  }

  for (const chart of charts) {
    chart.start();
  }

  bigDataButton.addEventListener('click', event => {
    event.preventDefault();
    bigDataButton.remove();
    bigDataButton = null;
    charts.push(addChart(makeRandomChartData(10000), true));
  });
}
