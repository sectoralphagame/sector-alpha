module.exports = {
  setupFiles: ["jest-canvas-mock"],
  testEnvironment: "jsdom",
  resetMocks: false,
  transform: {
    "^.+\\.(jsx?|tsx?)$": [
      "<rootDir>/TransformerESBuild.js",
      {
        sourcemap: true,
        target: "es2020",
        loader: "tsx",
      },
    ],
    ".+\\.(svg|css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$":
      "jest-transform-stub",
  },
  testRegex: ".*\\.test\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js"],
  moduleNameMapper: {
    "@assets/(.*)$": "<rootDir>/assets/$1",
    "@core/(.*)$": "<rootDir>/core/$1",
    "@devtools/(.*)$": "<rootDir>/devtools/$1",
    "@kit/(.*)$": "<rootDir>/kit/$1",
    "@ui/(.*)$": "<rootDir>/ui/$1",
  },
};
