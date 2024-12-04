import { Vec3, Vec4 } from "ogl";

export class Light {
  uniforms: {
    position: { value: Vec4 };
    color: { value: Vec3 };
    intensity: { value: number };
    visible: { value: number };
  };

  constructor(
    color: Vec3,
    intensity: number,
    position: Vec3,
    directional: boolean,
    visible = true
  ) {
    this.uniforms = {
      position: {
        value: new Vec4(
          position.x,
          position.y,
          position.z,
          directional ? 0 : 1
        ),
      },
      color: { value: color },
      intensity: { value: intensity },
      visible: { value: visible ? 1 : 0 },
    };
  }

  setIntensity(intensity: number) {
    this.uniforms.intensity.value = intensity;
  }

  setColor(color: Vec3) {
    this.uniforms.color.value = color;
  }

  get position() {
    return this.uniforms.position.value;
  }

  setPosition(position: Vec3) {
    this.uniforms.position.value.set(
      position.x,
      position.y,
      position.z,
      this.uniforms.position.value.w
    );
  }
}

export const dummyLight = new Light(new Vec3(0), 0, new Vec3(0), false, false);
