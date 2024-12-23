import { Transform, Vec3, Vec4 } from "ogl";

const tempVec3 = new Vec3();

export class Light extends Transform {
  name = "Light";
  uniforms: {
    position: { value: Vec4 };
    color: { value: Vec3 };
    intensity: { value: number };
    visible: { value: number };
  };
  frustumCulled = false;
  program = {
    transparent: false,
    depthTest: false,
  };

  constructor(
    color: Vec3,
    intensity: number,
    directional: boolean,
    visible = true
  ) {
    super();

    this.uniforms = {
      position: {
        value: new Vec4(0, 0, 0, directional ? 0 : 1),
      },
      color: { value: color },
      intensity: { value: intensity },
      visible: { value: visible ? 1 : 0 },
    };
  }

  draw() {
    this.updateMatrixWorld();
  }

  setIntensity(intensity: number) {
    this.uniforms.intensity.value = intensity;
  }

  setColor(color: Vec3) {
    this.uniforms.color.value = color;
  }

  updateMatrixWorld(force?: boolean): void {
    super.updateMatrixWorld(force);

    tempVec3
      .set(this.position.x, this.position.y, this.position.z)
      .applyMatrix4(this.worldMatrix);
    this.uniforms.position.value.set(
      tempVec3.x,
      tempVec3.y,
      tempVec3.z,
      this.uniforms.position.value.w
    );
  }
}

export const dummyLight = new Light(new Vec3(0), 0, false, false);
