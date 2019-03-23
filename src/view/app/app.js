import {fontFamily, themeTransitionDuration, themeTransitionDurationCSS} from '../../style';
import makeChart from '../chart/chart';
import styles from './app.css?module';

const template = `
<div></div>
<div class="${styles.themeSwitcherHolder}"></div>
<div class="${styles.themeSwitcher}" style="${themeTransitionDurationCSS}">
  <button
    class="${styles.themeSwitcherButton}"
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
  const themeButton = element.querySelector(`.${styles.themeSwitcherButton}`);

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

  themeButton.addEventListener('click', event => {
    event.preventDefault();
    switchTheme();
  });
  applyTheme();

  for (const chartData of chartsData) {
    const chartBox = document.createElement('div');
    chartBox.className = styles.chart;
    element.firstElementChild.appendChild(chartBox);

    charts.push(makeChart(chartBox, chartData, theme));
  }

  for (const chart of charts) {
    chart.start();
  }
}
