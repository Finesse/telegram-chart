import memoizeOne from 'memoize-one';
import {themeTransitionCSS} from '../../style';
import {htmlToElement} from '../../helpers/dom';
import {formatDateForDetails} from '../../helpers/date';
import styles from './columnDetails.css?module';
import {numberColorToRGBA} from "../../helpers/color";

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
    lineElement.style.color = numberColorToRGBA(color);
    lineElement.lastElementChild.textContent = name;
    lineElement.dataset.key = key;
    linesList.appendChild(lineElement);
  }

  const setState = memoizeOne((screenPosition, opacity, dateIndex, linesState) => {
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

    header.textContent = formatDateForDetails(dates[dateIndex]);

    let isAnyLineEnabled = false;

    for (const item of valuesList.children) {
      const key = item.dataset.key;
      if (linesState[key].enabled) {
        isAnyLineEnabled = true;
        item.style.display = '';
        item.firstElementChild.textContent = linesData[key].values[dateIndex];
      } else {
        item.style.display = 'none';
      }
    }

    valuesList.style.display = isAnyLineEnabled ? '' : 'none';
  });

  return {element, setState};
}
