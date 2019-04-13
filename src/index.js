import './polyfills';
import chartData from './data';
import convertChartData from './convertChartData';
import makeApp from './view/app/app';

makeApp(document.getElementById('root'), convertChartData(chartData));
