import { Program, Texture, Vec3 } from "ogl";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { TextureName } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { colorToVec3 } from "@core/utils/maps";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import type { Uniforms } from "../material";
import { Material } from "../material";

export class AsteroidDustMaterial extends Material {
  uniforms: Material["uniforms"] &
    Uniforms<{
      tMap: Texture;
      uColor: Vec3;
      uEmissive: number;
      uAlpha: number;
    }>;

  constructor(
    engine: Engine3D,
    texture: TextureName,
    opts: {
      color: string;
      emissive: number;
      alpha: number;
    }
  ) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      cullFace: false,
    });

    const tMap = new Texture(engine.gl, {
      image: assetLoader.getTexture(texture),
      generateMipmaps: false,
    });
    this.uniforms.tMap = { value: tMap };
    this.uniforms.uColor = { value: new Vec3(1, 1, 1) };
    this.uniforms.uEmissive = { value: opts.emissive };
    this.uniforms.uAlpha = { value: opts.alpha };

    this.setColor(opts.color);
  }

  setColor(color: string) {
    colorToVec3(color, this.uniforms.uColor.value);
  }
}
