import webpack from 'webpack';
import path from 'path';
import eslintFriendlyFormatter from 'eslint-friendly-formatter';
import VueLoaderPlugin from 'vue-loader/lib/plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WasmPackPlugin from '@wasm-tool/wasm-pack-plugin';
import config from '../config';
import utils from './utils';

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

export default {
  entry: {
    app: './src/main.js',
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath,
  },
  resolve: {
    extensions: ['.mjs', '.js', '.vue', '.json'],
    modules: [
      resolve('src'),
      resolve('node_modules'),
    ],
    alias: {
      vue$: 'vue/dist/vue.common.js',
      src: resolve('src'),
      assets: resolve('src/assets'),
      components: resolve('src/components'),
      tinyqueue: resolve('node_modules/tinyqueue/tinyqueue.js'),
    },
  },
  module: {
    rules: [
      // {
      //   test: /\.(js|vue)$/,
      //   loader: 'eslint-loader',
      //   enforce: 'pre',
      //   include: [resolve('src')],
      //   options: {
      //     formatter: eslintFriendlyFormatter,
      //   },
      // },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: [resolve('src')],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
      {
        test: /\.s?[ac]ss$/,
        use: process.env.NODE_ENV !== 'production' ? [
          'vue-style-loader?sourceMap=true',
          'css-loader?sourceMap=true',
          'postcss-loader?sourceMap=true',
          'sass-loader?sourceMap=true',
        ] : [
          MiniCssExtractPlugin.loader,
          'vue-style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          esModule: false,
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]'),
        },
        exclude: [
          path.resolve(__dirname, '../src/assets/models'),
        ],
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          esModule: false,
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]'),
        },
      },
      {
        test: /\.gltf$/,
        use: [
          {
            loader: 'file-loader',
            options: { esModule: false },
          },
          '@vxna/gltf-loader',
        ],
      },
      {
        test: /\.(bin|jpe?g|png)$/,
        loader: 'file-loader',
        options: { esModule: false },
        include: [
          path.resolve(__dirname, '../src/assets/models'),
        ],
        exclude: [
          path.resolve(__dirname, '../src/wasm'),
        ],
      },
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
  plugins: [
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, '../src/wasm'),
      watchDirectories: [
        path.resolve(__dirname, '../src/wasm/src'),
      ],
      forceMode: 'production',
    }),
    new webpack.ProvidePlugin({
      Payload: [path.resolve(__dirname, '../src/utils'), 'default'],
    }),
    new VueLoaderPlugin(),
    new FaviconsWebpackPlugin({
      logo: path.resolve(__dirname, '../src/assets/favicon.png'),
      favicons: {
        icons: {
          android: false,
          appleIcon: false,
          appleStartup: false,
          coast: false,
          favicons: true,
          firefox: false,
          windows: false,
          yandex: false,
        },
      },
    }),
  ],
};
