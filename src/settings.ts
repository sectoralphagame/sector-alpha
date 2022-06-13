export const isTest = process.env.NODE_ENV === "test";

const settings = {
  global: {
    friction: 0,
    targetFps: 60,
  },
};

export default settings;
