import type { Post, Texture } from "ogl";
import { Vec2, RenderTarget, Mesh, Program } from "ogl";
import type { Uniforms } from "@ogl-engine/materials/material";
import type { RenderingContext } from "@ogl-engine/engine/engine";
import vertex from "./shader.vert.glsl";
import downsampleFragment from "./downsample.frag.glsl";
import upsampleFragment from "./upsample.frag.glsl";

export type BloomUniforms = Uniforms<{
  tMap: Texture;
  uTexel: Vec2;
  uOffset: number;
}>;

const maxIterations = 6;

export class DualKawasePost {
  downsample: Program;
  upsample: Program;
  iterations = 4;
  mesh: Mesh;
  levels: RenderTarget[] = [];
  temps: RenderTarget[] = [];
  samplePosMult = 1.625;
  width = 0;
  height = 0;

  init(post: Post) {
    const gl = post.gl as RenderingContext;

    const uniforms: BloomUniforms = {
      tMap: { value: null as any },
      uTexel: { value: new Vec2() },
      uOffset: { value: this.samplePosMult },
    };

    this.downsample = new Program(gl, {
      vertex,
      fragment: downsampleFragment,
      uniforms,
    });
    this.upsample = new Program(gl, {
      vertex,
      fragment: upsampleFragment,
      uniforms,
    });

    this.mesh = new Mesh(gl, {
      geometry: post.geometry,
    });

    for (let i = 0; i < maxIterations; i++) {
      const opts = {
        type: gl.HALF_FLOAT,
        format: gl.RGBA,
        internalFormat: gl.RGBA16F,
        depth: false,
      };
      this.levels.push(new RenderTarget(gl, opts));
      this.temps.push(new RenderTarget(gl, opts));
    }
  }

  resize(post: Post) {
    this.width = post.fbo.read.width;
    this.height = post.fbo.read.height;

    for (let i = 0; i < maxIterations; i++) {
      this.levels[i].setSize(this.width >> (i + 1), this.height >> (i + 1));
      this.temps[i].setSize(this.width >> (i + 1), this.height >> (i + 1));
    }
  }

  swap(i: number) {
    const t = this.levels[i];
    this.levels[i] = this.temps[i];
    this.temps[i] = t;
  }

  render(post: Post) {
    if (
      this.width !== post.fbo.read.width ||
      this.height !== post.fbo.read.height
    ) {
      this.resize(post);
    }

    this.mesh.program = this.downsample;
    for (let i = 0; i < this.iterations; i++) {
      const tMap = i === 0 ? post.fbo.read : this.levels[i - 1];
      this.downsample.uniforms.tMap.value = tMap.texture;
      this.downsample.uniforms.uOffset.value = this.samplePosMult;
      this.downsample.uniforms.uTexel.value.set(
        1 / tMap.width,
        1 / tMap.height
      );
      post.gl.renderer.render({
        scene: this.mesh,
        target: this.levels[i],
        clear: true,
      });
    }

    this.mesh.program = this.upsample;
    for (let i = this.iterations - 2; i >= 0; i--) {
      this.upsample.uniforms.tMap.value = this.levels[i + 1].texture;
      this.upsample.uniforms.uOffset.value = this.samplePosMult;
      this.upsample.uniforms.uTexel.value.set(
        1 / this.levels[i].width,
        1 / this.levels[i].height
      );
      post.gl.renderer.render({
        scene: this.mesh,
        target: i === 0 ? post.fbo.write : this.temps[i],
        clear: true,
      });

      this.swap(i);
    }

    post.fbo.swap();
    post.uniform.value = post.fbo.read.texture;
  }
}
