import {htmlToElement} from '../../helpers/dom';
import {numberColorToRGBA} from '../../helpers/color';
import {watchLongTap} from '../../helpers/gesture';
import styles from './toggleButton.css?module';

const template = `
<button class="${styles.button}">
  <span class="${styles.background}"></span>
  <span class="${styles.checkmark}"><i></i><i></i></span>
  <span class="${styles.name}">
    <span></span><span></span>
  </span>
</button>
`;

export default function makeToggleButton(color, name, onClick, onLongClick, className) {
  const cssColor = numberColorToRGBA(color, 1);
  const button = htmlToElement(template);
  button.style.borderColor = cssColor;
  button.querySelector(`.${styles.background}`).style.backgroundColor = cssColor;
  const nameElements = button.querySelectorAll(`.${styles.name} span`);
  nameElements[0].textContent = nameElements[1].textContent = name;
  nameElements[0].style.color = cssColor;

  if (className) {
    button.classList.add(className);
  }

  let currentState = null;

  function setState(state) {
    state = !!state;

    if (state !== currentState) {
      currentState = state;
      if (currentState) {
        button.classList.add(styles.on);
      } else {
        button.classList.remove(styles.on);
      }
    }
  }

  watchLongTap(button, onClick, onLongClick);

  return {element: button, setState};
}
