import { Transform } from "ogl";
import type { Engine } from "./engine";

export class Scene extends Transform {
  engine: Engine;
  name = "Scene";

  constructor(engine: Engine) {
    super();

    this.engine = engine;
  }
}
