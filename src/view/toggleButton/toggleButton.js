import {themeTransitionCSS} from '../../style';
import {htmlToElement} from '../../helpers/dom';
import {numberColorToRGBA} from '../../helpers/color';
import styles from './toggleButton.css?module';
import iconSVG from './icon.svg?raw';

const template = `
<button class="${styles.button}" style="${themeTransitionCSS}">
  ${iconSVG}
  <span class="${styles.name}"></span>
</button>
`;

// todo: The icon animation makes the whole page repaint. Optimize it.
export default function makeToggleButton(color, name, isOn, onToggle, className) {
  const button = htmlToElement(template);

  if (className) {
    button.classList.add(className);
  }

  const iconElement = button.querySelector('svg');
  iconElement.classList.add(styles.icon);
  iconElement.querySelector('circle').style.fill = numberColorToRGBA(color);

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
