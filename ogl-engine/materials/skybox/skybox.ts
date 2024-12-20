import { skyboxes } from "@assets/textures/skybox";
import { Vec3, Box, Mesh, Program, Texture } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import { Light } from "@ogl-engine/engine/Light";
import vertex from "./shader.vert.glsl";
import fragment from "./shader.frag.glsl";

export class Skybox extends Mesh {
  private color: Vec3;
  private light: Light;
  name = "Skybox";
  engine: Engine;

  constructor(engine: Engine, name: keyof typeof skyboxes) {
    super(engine.gl, {
      geometry: new Box(engine.gl),
      program: new Program(engine.gl, {
        vertex,
        fragment,
        uniforms: {
          tMap: {
            value: new Texture(engine.gl, {
              target: engine.gl.TEXTURE_CUBE_MAP,
            }),
          },
          fCameraNear: { value: engine.camera.near },
          fCameraFar: { value: engine.camera.far },
        },
        cullFace: null,
      }),
      frustumCulled: false,
    });

    this.loadTexture(name);
    this.engine = engine;
    this.color = new Vec3(1);
    this.scale.set(1e3);
    this.light = new Light(this.color, 0.5, true);
    this.light.position.set(0, -1, -0.4);
    this.light.setParent(this);
    this.engine.addLight(this.light);
  }

  loadTexture(texture: keyof typeof skyboxes) {
    this.program.uniforms.tMap.value.image = [
      skyboxes[texture].right,
      skyboxes[texture].left,
      skyboxes[texture].top,
      skyboxes[texture].bottom,
      skyboxes[texture].front,
      skyboxes[texture].back,
    ].map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.program.uniforms.tMap.value.needsUpdate = true;
      };
      return img;
    });
  }

  destroy = () => {
    this.engine.removeLight(this.light);
    // this.setParent(null);
  };
}
