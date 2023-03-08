export const isHeadless =
  !(global.window && global.document) || process.env.NODE_ENV === "test";

const settings = {
  bootTime: 3600 / 20,
  global: {
    targetFps: 60,
  },
};

export default settings;
