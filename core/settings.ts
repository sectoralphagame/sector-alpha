export const isHeadless =
  !(global.window && global.document) || process.env.NODE_ENV === "test";
export const isDev = process.env.NODE_ENV === "development";

export const settings = {
  camera: {
    near: 1e-2,
    far: 1e8,
  },
  bootTime: 3600,
  global: {
    targetFps: 240,
  },
};

export interface GameSettings {
  pauseOnMissionOffer: boolean;
  scale: number;
  dev: boolean;
  volume: Record<"ui", number>;
  graphics: {
    fxaa: boolean;
    godrays: boolean;
  };
  camera: {
    pan: number;
    zoom: number;
  };
}

export const defaultGameSttings: GameSettings = {
  pauseOnMissionOffer: true,
  scale: 10,
  dev: false,
  volume: {
    ui: 1,
  },
  graphics: {
    fxaa: false,
    godrays: false,
  },
  camera: {
    pan: 1,
    zoom: 1,
  },
};

export default settings;
