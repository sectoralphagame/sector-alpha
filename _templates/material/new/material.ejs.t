---
to: ogl-engine/materials/<%= name %>/<%= name %>.ts
---

interface <%= h.capitalize(name) %>MaterialArgs {
  
}

import type { Engine3D } from "@ogl-engine/engine/engine3d";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class <%= h.capitalize(name) %>Material extends Material {
  uniforms: Material["uniforms"] & {
    
  };

  constructor(engine: Engine3D, args: <%= h.capitalize(name) %>MaterialArgs) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {},
    );

    this.uniforms.
  }
}
