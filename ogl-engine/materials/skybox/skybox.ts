import { skyboxes } from "@assets/textures/skybox";
import type { OGLRenderingContext, Transform } from "ogl";
import { Box, Mesh, Program, Texture } from "ogl";
import vertex from "./shader.vert.glsl";
import fragment from "./shader.frag.glsl";

export class Skybox {
  private textureName: keyof typeof skyboxes;
  private texture: Texture;
  transform: Transform;

  constructor(
    gl: OGLRenderingContext,
    scene: Transform,
    name: keyof typeof skyboxes
  ) {
    this.textureName = name;
    this.texture = new Texture(gl, {
      target: gl.TEXTURE_CUBE_MAP,
    });
    this.transform = new Mesh(gl, {
      geometry: new Box(gl),
      program: new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          tMap: { value: this.texture },
        },
        cullFace: false,
      }),
    });
    this.loadTexture();
    this.transform.scale.set(1e4);
    scene.addChild(this.transform);
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
}
