# Telegram chart

This is a JS solution for [the Telegram April 2019 coding contest](https://t.me/contest/59).
The goal was to develop an application for showing charts based on [the input data](src/data) and the [design specification](docs/design).
The solution is implemented without the bonus goals.

The solution page on the official contest platform: http://contest.dev/chart-js/entry18

## How to start the application

First install the application:

1. Make sure you have [Node.js](http://nodejs.org) installed
2. Download the source code
3. Open a terminal and go to the source code directory
4. Run `npm install`

### Development mode

1. Run `npm start`
2. Open http://localhost:8000 in a browser

### Production mode

1. Run `npm run build`
2. Open the `dist/index.html` file in a browser

If you want to serve the application with a web server,
upload the content of the `dist` directory to the web server and make the directory be the document root of the server. 

## Architecture concepts

I've chosen [canvas](https://developer.mozilla.org/en-US/docs/HTML/Canvas) to draw the charts
because it's the best approach in terms of performance and reliability.
The DOM is manipulated using a pure JS to make it fast and the code small.

The chart supports multiple touches.

The source code is compiled to the distributive code using [Webpack](http://webpack.js.org) and [Babel](http://babeljs.io).
