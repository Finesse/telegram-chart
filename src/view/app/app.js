import {fontFamily, themeTransitionDuration, themeTransitionDurationCSS} from '../../style';
import makeChart from '../chart/chart';
import styles from './app.css?module';
import makeBigChartData from "../../makeBigChartData";

const template = `
<div></div>
<div class="${styles.bigDataBlock}">
  <button
    class="${styles.button}"
    style="${themeTransitionDurationCSS}"
  >Show BIG data</button>
</div>
<div class="${styles.themeSwitcherHolder}"></div>
<div class="${styles.themeSwitcher}" style="${themeTransitionDurationCSS}">
  <button
    class="${styles.button}"
    style="${themeTransitionDurationCSS}"
  ></button>
</div>
`;

export default function makeApp(element, chartsData) {
  let theme = 'day';
  const charts = [];

  document.body.style.fontFamily = fontFamily;
  document.body.style.transitionDuration = `${themeTransitionDuration}ms`;
  element.innerHTML = template;
  const themeButton = element.querySelector(`.${styles.themeSwitcher} button`);
  let bigDataBlock = element.querySelector(`.${styles.bigDataBlock}`);

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

  bigDataBlock.querySelector('button').addEventListener('click', event => {
    event.preventDefault();
    bigDataBlock.remove();
    bigDataBlock = null;
    charts.push(addChart(makeBigChartData(10000), true));
  });
}
