import { example } from "./example";
import { earth } from "./earth";
import { sectoralpha } from "./sectoralpha";
import { teegarden2 } from "./teegarden2";
import { gaia } from "./gaia";

export const skyboxes = {
  example,
  earth,
  sectoralpha,
  teegarden2,
  gaia,
};
export type SkyboxTexture = keyof typeof skyboxes;
