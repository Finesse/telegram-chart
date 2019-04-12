import memoizeOne from 'memoize-one';
import {htmlToElement} from '../../helpers/dom';
import styles from './rotatingDisplay.css?module';

const template = `
<div class="${styles.container}">
  <div class="${styles.heightHolder}">0</div>
  <div class="${styles.item}"></div>
  <div class="${styles.item}"></div>
</div>
`;

export default function makeRotatingDisplay(getItemText, topAlign = 0.5, bottomAlign = 0.5, className = '') {
  const element = htmlToElement(template);
  if (className) {
    element.classList.add(className);
  }

  const itemsElements = [...element.querySelectorAll(`.${styles.item}`)];
  const itemsIndices = [null, null];

  function swapItems() {
    swapElements(itemsElements);
    swapElements(itemsIndices);
  }

  function getItemElementStyle(itemIndex, displayIndex) {
    const distanceToCenter = Math.abs(itemIndex - displayIndex);
    const scale = 1 - distanceToCenter * 0.5;
    const moveToEdgeDistance = 0.5 - scale / 2;
    const align = itemIndex > displayIndex ? bottomAlign : topAlign;

    return {
      transform: `translate(${(align - 0.5) * 2 * moveToEdgeDistance * 100}%, ${(itemIndex - displayIndex) * 60}%) scale(${scale})`,
      opacity: 1 - distanceToCenter
    };
  }

  const setPosition = memoizeOne(index => {
    const newItemIndices = [Math.floor(index), Math.floor(index) + 1];

    // Swap to not change an item element text when possible
    if (itemsIndices[0] === newItemIndices[1] || itemsIndices[1] === newItemIndices[0]) {
      swapItems();
    }

    if (itemsIndices[0] !== newItemIndices[0]) {
      itemsElements[0].textContent = getItemText(newItemIndices[0]);
    }
    if (itemsIndices[1] !== newItemIndices[1]) {
      itemsElements[1].textContent = getItemText(newItemIndices[1]);
    }

    Object.assign(itemsElements[0].style, getItemElementStyle(newItemIndices[0], index));
    Object.assign(itemsElements[1].style, getItemElementStyle(newItemIndices[1], index));

    itemsIndices[0] = newItemIndices[0];
    itemsIndices[1] = newItemIndices[1];
  });

  return {element, setPosition};
}

function swapElements(array) {
  const temp = array[0];
  array[0] = array[1];
  array[1] = temp;
}
