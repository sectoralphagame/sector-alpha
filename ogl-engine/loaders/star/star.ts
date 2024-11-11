import type { GLTF } from "ogl";
import { Vec3, Transform, GLTFLoader, Program, TextureLoader, Mesh } from "ogl";
import smoke from "@assets/textures/smoke.jpg";
import starModel from "@assets/models/world/star.glb";
import type { Engine } from "@ogl-engine/engine/engine";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export class Star {
  private color: Vec3;
  readonly transform: Transform;
  program: Program;

  constructor(engine: Engine, gltfModel: GLTF, color: Vec3) {
    this.transform = new Transform();
    this.initProgram(engine);
    this.setColor(color);

    gltfModel.scenes[0].forEach((gltfScene) => {
      gltfScene.traverse((node) => {
        if (node instanceof Mesh && node.program) {
          node.program = this.program;
          this.transform.addChild(node);
        }
      });
    });

    engine.scene.addChild(this.transform);
    engine.scene.updateMatrixWorld();
  }

  initProgram = (engine: Engine) => {
    const tSmoke = TextureLoader.load(engine.gl, {
      src: {
        jpg: smoke,
      },
      wrapS: engine.gl.REPEAT,
      wrapT: engine.gl.REPEAT,
    });

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: engine.uniforms.uTime,
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

export async function addStar(engine: Engine, color: Vec3) {
  const gltfModel = await GLTFLoader.load(engine.gl, starModel);
  return new Star(engine, gltfModel, color);
}
