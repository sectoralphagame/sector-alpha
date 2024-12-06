import type { Engine } from "@ogl-engine/engine/engine";
import { Texture } from "ogl";

export async function loadTexture(
  engine: Engine,
  url: string
): Promise<Texture> {
  const image = new Image();
  image.src = url;

  return new Promise((resolve) => {
    image.onload = () => {
      const texture = new Texture(engine.gl, {
        image,
      });
      resolve(texture);
    };
  });
}
