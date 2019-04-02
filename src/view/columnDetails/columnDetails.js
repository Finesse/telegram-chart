import memoizeOne from 'memoize-one';
import {themeTransitionCSS} from '../../style';
import {htmlToElement} from '../../helpers/dom';
import {formatDate} from '../../helpers/date';
import styles from './columnDetails.css?module';

const template = `
<div class="${styles.holder}" style="visibility: hidden;">
  <div class="${styles.pusher}"></div>
  <div class="${styles.content}" style="${themeTransitionCSS}">
    <div class="${styles.header}"></div>
    <ul class="${styles.values}"></ul>
  </div>
  <div class="${styles.pusher}"></div>
</div>
`;

const lineTemplate = `
<li>
  <div class="${styles.price}"></div>
  <div class="${styles.label}"></div>
</li>
`;

export default function makeToggleButton(linesData, dates, className) {
  const element = htmlToElement(template);
  const linesList = element.querySelector(`.${styles.values}`);
  const linesEntries = Object.entries(linesData);

  if (className) {
    element.classList.add(className);
  }

  for (const [key, {color, name}] of Object.values(linesEntries)) {
    const lineElement = htmlToElement(lineTemplate);
    lineElement.style.color = color;
    lineElement.lastElementChild.textContent = name;
    lineElement.dataset.key = key;
    linesList.appendChild(lineElement);
  }

  const setState = memoizeOne((screenPosition, opacity, dateIndex) => {
    if (opacity <= 0) {
      element.style.visibility = 'hidden';
      return;
    }

    const [leftPusher, contentBlock, rightPusher] = element.children;
    const [header, valuesList] = contentBlock.children;

    element.style.visibility = '';
    leftPusher.style.flexGrow = screenPosition;
    rightPusher.style.flexGrow = 1 - screenPosition;
    contentBlock.style.opacity = opacity;
    contentBlock.style.transform = `translateY(${(opacity - 1) * 10}px)`;

    header.textContent = formatDate(dates[dateIndex], true);

    for (const item of valuesList.children) {
      const key = item.dataset.key;
      item.firstElementChild.textContent = linesData[key].values[dateIndex];
    }
  });

  return {element, setState};
}
