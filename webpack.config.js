const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');
const csso = require('postcss-csso');

const sourceDirectory = 'src';
const distDirectory = 'build';

function makeCSSLoaders(useCSSModules, isDevelopment) {
  return [
    MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        sourceMap: isDevelopment,
        importLoaders: 1,

        ...(useCSSModules && {
          modules: true,
          localIdentName: isDevelopment ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:10]',
        })
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        plugins: [
          ...(isDevelopment ? [] : [csso]),
          autoprefixer
        ],
        sourceMap: isDevelopment && 'inline'
      }
    }
  ];
}

module.exports = (env, argv) => {
  const {mode, analyze} = argv;
  const isDevelopment = mode !== 'production';

  return {
    entry: `./${sourceDirectory}/index.js`,
    mode,
    devtool: isDevelopment ? 'inline-source-map' : undefined,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env'
              ],
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-proposal-class-properties'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          oneOf: [
            {
              resourceQuery: /(^|\?|&)module($|&)/i,
              use: makeCSSLoaders(true, isDevelopment)
            },
            {
              use: makeCSSLoaders(false, isDevelopment)
            }
          ]
        },
        {
          resourceQuery: /(^|\?|&)raw($|&)/i,
          use: 'raw-loader'
        }
      ]
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          sourceMap: true,
          terserOptions: {
            output: {
              comments: false
            }
          }
        })
      ]
    },
    output: {
      path: path.resolve(__dirname, distDirectory),
      filename: '[name].[hash].js'
    },
    devServer: {
      contentBase: `./${distDirectory}`,
      port: 8000
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].[hash].css'
      }),
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: `${sourceDirectory}/index.html`
      }),
      ...(analyze ? [
        new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
          analyzerPort: 8001
        })
      ] : [])
    ]
  };
};
