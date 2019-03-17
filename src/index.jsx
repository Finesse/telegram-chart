import {render} from 'inferno';
import chartData from './chart_data';
import convertChartData from './convertChartData';
import App from './components/App/App';

render(
  <App chartData={convertChartData(chartData)} />,
  document.getElementById('root')
);
