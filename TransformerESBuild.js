// Shamelessly copied from https://github.com/aelbore/esbuild-jest/issues/69

const { transformSync } = require("esbuild");

const defaultOptions = {
  format: "cjs",
};

module.exports = {
  createTransformer(userOptions) {
    return {
      canInstrument: true,
      process(sourceText, sourcePath) {
        const options = {
          ...defaultOptions,
          ...userOptions,
          sourcefile: sourcePath,
        };
        const { code, map } = transformSync(sourceText, options);
        return { code, map };
      },
    };
  },
};
