import {themeTransitionDurationCSS} from '../../style';
import styles from './ToggleButton.css?module';

export default function ToggleButton({color, name, on, className = '', clickData, onClick}) {
  const handleClick = event => {
    event.preventDefault();
    if (onClick) {
      onClick(clickData);
    }
  };

  return (
    <button
      className={`${styles.button} ${on ? styles.on : ''} ${className}`}
      style={themeTransitionDurationCSS}
      onClick={handleClick}
    >
      <span className={styles.icon} style={`background-color: ${color}; border-color: ${color};`} />
      <span className={styles.name}>{name}</span>
    </button>
  );
}
