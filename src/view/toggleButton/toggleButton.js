import {themeTransitionDurationCSS} from '../../style';
import {htmlToElement} from '../../helpers/dom';
import styles from './toggleButton.css?module';

const template = `
<button class="${styles.button}" style="${themeTransitionDurationCSS}">
  <span class="${styles.icon}"></span>
  <span class="${styles.name}"></span>
</button>
`;

export default function makeToggleButton(color, name, isOn, onToggle, className) {
  const button = htmlToElement(template);

  if (className) {
    button.classList.add(className);
  }

  Object.assign(button.querySelector(`.${styles.icon}`).style, {
    backgroundColor: color,
    borderColor: color
  });

  button.querySelector(`.${styles.name}`).textContent = name;

  function applyState() {
    if (isOn) {
      button.classList.add(styles.on);
    } else {
      button.classList.remove(styles.on);
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
