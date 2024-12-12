import type { Engine } from "@ogl-engine/engine/engine";
import type { ImageRepresentation } from "ogl";
import { Texture } from "ogl";

export async function loadTextureImage(
  url: string
): Promise<ImageRepresentation> {
  const image = new Image();
  image.src = url;

  return new Promise((resolve) => {
    image.onload = () => {
      resolve(image);
    };
  });
}

export async function loadTexture(
  engine: Engine,
  url: string
): Promise<Texture> {
  const image = await loadTextureImage(url);
  return new Texture(engine.gl, { image });
}
