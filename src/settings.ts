export const isHeadless =
  !(global.window && global.document) || process.env.NODE_ENV === "test";

const settings = {
  global: {
    maxMineablePrice: 100,
    minPrice: 10,
    maxPrice: 20000,
    targetFps: 60,
  },
};

export default settings;
