import {Component} from 'inferno';
import {fontFamily} from '../../style';
import Chart from '../Chart/Chart';
import styles from './App.css?module';

// todo: Add the theme switcher
export default class App extends Component {
  componentDidMount() {
    document.body.style.fontFamily = fontFamily;
  }

  render() {
    return <>
      {this.props.chartData.map(chart => (
        <div className={styles.chart}>
          <Chart {...chart} />
        </div>
      ))}
    </>;
  }
}
