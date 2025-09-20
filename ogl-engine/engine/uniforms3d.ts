import type { Texture } from "ogl";
import { Vec2, Vec3 } from "ogl";
import type { Light } from "./Light";

export type Engine3DUniforms = {
  env: {
    camera: {
      scale: { value: number };
    };
    ambient: { value: Vec3 };
    lights: Light["uniforms"][];
    tEnvMap: { value: Texture };
    postProcessing: {
      godrays: {
        uDensity: { value: number };
        uWeight: { value: number };
        uDecay: { value: number };
        uExposure: { value: number };
      };
      bloom: {
        uGain: { value: number };
      };
      vignette: {
        uStrength: { value: number };
        uSmoothness: { value: number };
        uOffset: { value: number };
      };
      tonemapping: {
        uGamma: { value: number };
        uSaturation: { value: number };
        uContrast: { value: number };
        uExposure: { value: number };
        uMap: { value: number };
      };
    };
  };
  resolution: { base: { value: Vec2 }; bloom: { value: Vec2 } };
  uTime: { value: number };
  uSeed: { value: number };
};

export function createEngine3DUniforms(): Engine3DUniforms {
  return {
    env: {
      ambient: { value: new Vec3(0) },
      camera: {
        scale: { value: 1 },
      },
      lights: [],
      tEnvMap: { value: null! },
      postProcessing: {
        godrays: {
          uDensity: { value: 0.8 },
          uWeight: { value: 1 },
          uDecay: { value: 0.86 },
          uExposure: { value: 0.9 },
        },
        bloom: {
          uGain: { value: 0.85 },
        },
        vignette: {
          uStrength: { value: 0.51 },
          uSmoothness: { value: 0.45 },
          uOffset: { value: -0.53 },
        },
        tonemapping: {
          uGamma: { value: 1.08 },
          uContrast: { value: 1 },
          uSaturation: { value: 1 },
          uExposure: { value: 1.03 },
          uMap: { value: 1 },
        },
      },
    },
    resolution: {
      base: { value: new Vec2() },
      bloom: { value: new Vec2() },
    },
    uTime: { value: 0 },
    uSeed: { value: Math.random() },
  };
}
