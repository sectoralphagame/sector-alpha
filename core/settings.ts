export const isHeadless =
  !(global.window && global.document) || process.env.NODE_ENV === "test";
export const isDev = process.env.NODE_ENV === "development";

const settings = {
  bootTime: 3600,
  global: {
    targetFps: 60,
  },
};

export default settings;
