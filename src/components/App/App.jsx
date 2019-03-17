import {Component} from 'inferno';
import Chart from '../Chart/Chart';
import styles from './App.css?module';

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
