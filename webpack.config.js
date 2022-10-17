const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const config = {
  entry: ["./gateway/index.tsx"],
  module: {
    rules: [
      {
        test: /.*\.tsx$/,
        loader: "string-replace-loader",
        options: {
          search: /import_meta\.url/,
          replace: "import.meta.url",
        },
      },
      {
        test: /\.tsx?$/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2018",
        },
      },
      {
        test: /\.js?$/,
        loader: "esbuild-loader",
        resolve: {
          fullySpecified: false,
        },
        options: {
          target: "es2018",
        },
      },
      {
        test: /\.scss$/i,
        use: [
          "style-loader",
          {
            loader: "dts-css-modules-loader",
            options: {
              namedExport: true,
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(svg|png|jpe?g)$/,
        type: "asset/resource",
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: "./gateway/index.html",
    }),
    new ForkTsCheckerWebpackPlugin(),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    open: true,
    port: 10000,
    historyApiFallback: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: "./tsconfig.json",
      }),
    ],
  },
  devtool: "source-map",
};

module.exports = config;
