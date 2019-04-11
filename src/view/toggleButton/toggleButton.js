import {htmlToElement} from '../../helpers/dom';
import {numberColorToRGBA} from '../../helpers/color';
import styles from './toggleButton.css?module';

const template = `
<button class="${styles.button}">
  <span class="${styles.checkmark}"><i></i><i></i></span>
  <span class="${styles.name}"></span>
</button>
`;

export default function makeToggleButton(color, name, isOn, onToggle, className) {
  const solidColor = numberColorToRGBA(color, 1);
  const transparentColor = numberColorToRGBA(color, 0);
  const button = htmlToElement(template);
  const nameElement = button.querySelector(`.${styles.name}`);
  button.style.borderColor = solidColor;
  nameElement.textContent = name;

  if (className) {
    button.classList.add(className);
  }

  function applyState() {
    if (isOn) {
      button.classList.add(styles.on);
      button.style.backgroundColor = solidColor;
      nameElement.style.color = '';
    } else {
      button.classList.remove(styles.on);
      button.style.backgroundColor = transparentColor;
      nameElement.style.color = solidColor;
    }
  }

  button.addEventListener('click', event => {
    event.preventDefault();
    isOn = !isOn;
    try {
      onToggle(isOn);
    } finally {
      applyState();
    }
  });

  applyState();

  return button;
}
