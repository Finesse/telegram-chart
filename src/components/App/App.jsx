import {Component} from 'inferno';
import {fontFamily, themeTransitionDuration, themeTransitionDurationCSS} from '../../style';
import Chart from '../Chart/Chart';
import styles from './App.css?module';

// todo: Amend the app style so that it matches the designs
export default class App extends Component {
  state = {
    theme: 'day'
  };

  componentDidMount() {
    document.body.style.fontFamily = fontFamily;
    document.body.style.transitionDuration = `${themeTransitionDuration}ms`;

    this.applyTheme(null, this.state.theme);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.theme !== this.state.theme) {
      this.applyTheme(prevState.theme, this.state.theme);
    }
  }

  componentWillUnmount() {
    this.applyTheme(this.state.theme, null);
  }

  render() {
    return <>
      {this.props.chartData.map(chart => (
        <div className={styles.chart}>
          <Chart {...chart} theme={this.state.theme} />
        </div>
      ))}
      <div className={styles.themeSwitcherHolder} />
      <div className={styles.themeSwitcher} style={themeTransitionDurationCSS}>
        <button
          className={styles.themeSwitcherButton}
          onClick={this.handleSwitchThemeClick}
          style={themeTransitionDurationCSS}
        >
          Switch to {this.state.theme === 'day' ? 'Night' : 'Day'} Mode
        </button>
      </div>
    </>;
  }

  handleSwitchThemeClick = event => {
    event.preventDefault();

    this.setState({
      theme: this.state.theme === 'day' ? 'night' : 'day'
    });
  };

  applyTheme(prevTheme, nextTheme) {
    if (prevTheme) {
      document.body.classList.remove(`${prevTheme}Theme`);
    }
    if (nextTheme) {
      document.body.classList.add(`${nextTheme}Theme`);
    }
  }
}
