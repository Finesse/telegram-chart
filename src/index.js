import './polyfills';
import chartData from './chart_data';
import convertChartData from './convertChartData';
import makeApp from './view/app/app';

makeApp(document.getElementById('root'), convertChartData(chartData));
