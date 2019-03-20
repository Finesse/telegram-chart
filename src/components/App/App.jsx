import {Component} from 'inferno';
import Chart from '../Chart/Chart';
import styles from './App.css?module';

// todo: Add the theme switcher
export default class App extends Component {
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
