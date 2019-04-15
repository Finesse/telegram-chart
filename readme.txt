The archive contains 3 versions of the code:

- The source code in the "Source code" directory
- The joined source code in the ".js" and ".css" files of the root directory
- The minified joined code in the ".min.js" and ".min.css" files of the root directory

All these files represent the same code.
The minified files are used in the index.html file to achieve the best load time and performance.
All the derived files have source map files (".map") so you can read and debug the source code in a browser.
Also you can make sure that the minified code represents the source code by building the code yourself.

The only excess content of the derived files is the Webpack and Babel glue code.
You can take the source code and use it with your build system without any issues.

How to build the source code:

1. Open a terminal and go to the "Source code" directory
2. Run `npm install` (if you haven't run it before)
3. Run `npm run build`
4. Done. The result code is located in the "build" directory
