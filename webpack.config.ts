const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");
const { BugsnagSourceMapUploaderPlugin } = require("webpack-bugsnag-plugins");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const packageJson = require("./package.json");

const devMode = process.env.NODE_ENV !== "production";

const plugins = [
  new HtmlWebpackPlugin({
    inject: true,
    template: "./gateway/index.html",
  }),
  new ForkTsCheckerWebpackPlugin(),
  new EnvironmentPlugin({
    NODE_ENV: "development",
    BUGSNAG_API_KEY: "",
    BUILD_ENV: "local",
    STORYBOOK: false,
  }),
  new MiniCssExtractPlugin({
    filename: devMode ? "[name].css" : "[name].[contenthash].css",
    chunkFilename: devMode ? "[id].css" : "[id].[contenthash].css",
  }),
];

if (
  process.env.BUGSNAG_API_KEY &&
  process.env.NODE_ENV === "production" &&
  process.env.BUILD_ENV
) {
  plugins.push(
    new BugsnagSourceMapUploaderPlugin({
      apiKey: process.env.BUGSNAG_API_KEY,
      appVersion: packageJson.version,
      releaseStage: process.env.BUILD_ENV,
      overwrite: true,
    })
  );
}

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
          target: "es2020",
        },
      },
      {
        test: /\.js?$/,
        loader: "esbuild-loader",
        resolve: {
          fullySpecified: false,
        },
        options: {
          target: "es2020",
        },
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "dts-css-modules-loader",
            options: {
              namedExport: true,
              banner:
                "/* @generated */\n/* prettier-ignore */\n/* eslint-disable */",
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          "./build/css-helpers-loader.ts",
          "sass-loader",
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /world\/data\/missions\/.*\.yml$/,
        use: ["./build/conversation-loader.ts"],
      },
      {
        test: /\.(svg|png|jpe?g|wav|glb)$/,
        type: "asset/resource",
      },
      {
        test: /\.glsl$/,
        use: ["./build/shader-loader.ts"],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "bundle.[hash].js",
    assetModuleFilename: devMode
      ? "[path][name][ext][query]"
      : "assets/[hash][ext][query]",
  },
  plugins,
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    open: true,
    port: 10000,
    historyApiFallback: true,
    client: {
      overlay: false,
    },
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
