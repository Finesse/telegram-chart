import styles from './safariAssKicker.css?module';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Safari skips rendering animation frames for some reason (despite calling requestAnimationFrame callbacks every 16ms).
 * This component is a hack to make Safari render on every animate frame.
 *
 * The element must be inserted somewhere without absolute positioning. There also must be a toggleButton CSS transition
 * meanwhile (it doesn't work with other transitions for some reason).
 *
 * Call the `kick` member on every update. It does nothing if the browser is not Safari.
 */
export default function makeSafariAssKicker() {
  const element = document.createElement('div');
  element.className = styles.block;

  let kickCount = 0;

  const kick = !isSafari ? (() => {}) : (() => {
    ++kickCount;
    element.style.width = 1 + (kickCount % 2) + 'px';
  });

  return {element, kick};
}
