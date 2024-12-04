import { skyboxes } from "@assets/textures/skybox";
import type { Transform } from "ogl";
import { Vec3, Box, Mesh, Program, Texture } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import { Light } from "@ogl-engine/engine/Light";
import vertex from "./shader.vert.glsl";
import fragment from "./shader.frag.glsl";

export class Skybox {
  private textureName: keyof typeof skyboxes;
  private texture: Texture;
  private color: Vec3;
  private light: Light;
  engine: Engine;
  transform: Transform;

  constructor(engine: Engine, scene: Transform, name: keyof typeof skyboxes) {
    const gl = engine.gl;

    this.engine = engine;
    this.textureName = name;
    this.texture = new Texture(gl, {
      target: gl.TEXTURE_CUBE_MAP,
    });
    this.color = new Vec3(1);
    this.transform = new Mesh(gl, {
      geometry: new Box(gl),
      program: new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          tMap: { value: this.texture },
          fCameraNear: { value: engine.camera.near },
          fCameraFar: { value: engine.camera.far },
        },
        cullFace: null,
      }),
      frustumCulled: false,
    });
    this.loadTexture();
    this.transform.scale.set(1e3);
    scene.addChild(this.transform);
    this.light = new Light(this.color, 12, new Vec3(0, -1, -0.4), true);
    this.engine.addLight(this.light);
  }

  async loadTexture() {
    function loadImage(src: string): Promise<HTMLImageElement> {
      return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }

    this.texture.image = await Promise.all(
      [
        skyboxes[this.textureName].right,
        skyboxes[this.textureName].left,
        skyboxes[this.textureName].top,
        skyboxes[this.textureName].bottom,
        skyboxes[this.textureName].front,
        skyboxes[this.textureName].back,
      ].map(loadImage)
    );
  }

  destroy = () => {
    this.engine.removeLight(this.light);
    this.transform.parent?.removeChild(this.transform);
  };
}
