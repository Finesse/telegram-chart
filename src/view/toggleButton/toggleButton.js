import {htmlToElement} from '../../helpers/dom';
import {numberColorToRGBA} from '../../helpers/color';
import {watchLongTap} from '../../helpers/gesture';
import styles from './toggleButton.css?module';

const template = `
<button class="${styles.button}">
  <span class="${styles.checkmark}"><i></i><i></i></span>
  <span class="${styles.name}"></span>
</button>
`;

export default function makeToggleButton(color, name, onClick, onLongClick, className) {
  const solidColor = numberColorToRGBA(color, 1);
  const transparentColor = numberColorToRGBA(color, 0);
  const button = htmlToElement(template);
  const nameElement = button.querySelector(`.${styles.name}`);
  button.style.borderColor = solidColor;
  nameElement.textContent = name;

  if (className) {
    button.classList.add(className);
  }

  let currentState = null;

  function setState(state) {
    state = !!state;

    if (state === currentState) {
      return;
    }

    currentState = state;

    // todo: Eliminate the painting stage by not changing the text color
    if (currentState) {
      button.classList.add(styles.on);
      button.style.backgroundColor = solidColor;
      nameElement.style.color = '';
    } else {
      button.classList.remove(styles.on);
      button.style.backgroundColor = transparentColor;
      nameElement.style.color = solidColor;
    }
  }

  watchLongTap(button, onClick, onLongClick);

  return {element: button, setState};
}
