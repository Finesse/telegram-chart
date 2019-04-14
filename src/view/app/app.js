import {fontFamily, themeTransitionStyle, themeTransitionCSS} from '../../style';
import makeChart from '../chart/chart';
import styles from './app.css?module';

const template = `
<div></div>
<div class="${styles.buttonsBlock}">
  ${/*
  <a
    href="http://github.com/Finesse/telegram-chart"
    target="_blank"
    class="${styles.button}"
    style="${themeTransitionCSS}"
  >See the source code</a>
  */''}
</div>
<div class="${styles.themeSwitcherHolder}"></div>
<div class="${styles.themeSwitcher}" style="${themeTransitionCSS}">
  <button
    class="${styles.button}"
    style="${themeTransitionCSS}"
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
  Object.assign(document.body.style, themeTransitionStyle);
  element.innerHTML = template;
  const themeButton = element.querySelector(`.${styles.themeSwitcher} button`);

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

    for (let i = 0; i < charts.length; ++i) {
      charts[i].setTheme(theme);
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

  for (let i = 0; i < chartsData.length; ++i) {
    charts.push(addChart(chartsData[i]));
  }

  for (let i = 0; i < charts.length; ++i) {
    charts[i].start();
  }
}
