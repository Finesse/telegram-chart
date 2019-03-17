import chartData from './chart_data';
import convertChartData from './convertChartData';
import Chart from './chart/Chart';
import styles from './app.css?module';

const convertedChartData = convertChartData(chartData);
const domRoot = document.getElementById('root');
const charts = [];

for (const chartData of convertedChartData) {
  const chartElement = document.createElement('div');
  chartElement.className = styles.chart;
  domRoot.appendChild(chartElement);

  charts.push(new Chart(chartElement, chartData));
}
