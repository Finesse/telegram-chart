import {render} from 'inferno';
import {Ticker} from '@pixi/ticker';
import {Renderer, BatchRenderer} from '@pixi/core';
import chartData from './chart_data';
import convertChartData from './convertChartData';
import App from './components/App/App';

Renderer.registerPlugin('batch', BatchRenderer);
Ticker.shared.autoStart = false;
Ticker.shared.stop();

render(
  <App chartData={convertChartData(chartData)} />,
  document.getElementById('root')
);
