const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const config = {
  entry: ["./src/index.ts"],
  module: {
    rules: [
      {
        test: /.*\.ts$/,
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
        test: /\.(svg|png|jpe?g)$/,
        type: "asset/resource",
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: "./src/index.html",
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
  },
  devtool: "source-map",
};

module.exports = config;
