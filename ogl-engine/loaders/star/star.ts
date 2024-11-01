import type { GLTF, OGLRenderingContext } from "ogl";
import { Vec3, Transform, GLTFLoader, Program, TextureLoader, Mesh } from "ogl";
import smoke from "@assets/textures/smoke.jpg";
import starModel from "@assets/models/world/star.glb";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export class Star {
  private color: Vec3;
  readonly transform: Transform;
  program: Program;

  constructor(
    gl: OGLRenderingContext,
    scene: Transform,
    gltfModel: GLTF,
    color: Vec3
  ) {
    this.transform = new Transform();
    this.initProgram(gl);
    this.setColor(color);

    gltfModel.scenes[0].forEach((gltfScene) => {
      gltfScene.traverse((node) => {
        if (node instanceof Mesh && node.program) {
          node.program = this.program;
          this.transform.addChild(node);
        }
      });
    });

    scene.addChild(this.transform);
    scene.updateMatrixWorld();
  }

  initProgram = (gl: OGLRenderingContext) => {
    const tSmoke = TextureLoader.load(gl, {
      src: {
        jpg: smoke,
      },
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
    });

    this.program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: {
          value: 0,
        },
        tSmoke: { value: tSmoke },
        vColor: { value: new Vec3() },
      },
    });
  };

  setColor(color: Vec3) {
    this.color = color;
    this.program.uniforms.vColor.value = this.color;
  }

  getColor(): Vec3 {
    return this.color;
  }
}

export async function addStar(
  gl: OGLRenderingContext,
  scene: Transform,
  color: Vec3
) {
  const gltfModel = await GLTFLoader.load(gl, starModel);
  return new Star(gl, scene, gltfModel, color);
}
