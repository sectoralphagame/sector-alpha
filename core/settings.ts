export const isHeadless =
  !(global.window && global.document) || process.env.NODE_ENV === "test";

const settings = {
  global: {
    targetFps: 60,
  },
};

export default settings;
