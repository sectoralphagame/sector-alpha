export const isTest = process.env.NODE_ENV === "test";

const settings = {
  global: {
    minPrice: 10,
    maxPrice: 20000,
    targetFps: 60,
  },
};

export default settings;
