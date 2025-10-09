import { example } from "./example";
import { earth } from "./earth";
import { sectoralpha } from "./sectoralpha";
import { teegarden1 } from "./teegarden1";
import { teegarden2 } from "./teegarden2";
import { gaia } from "./gaia";
import { deepspace1 } from "./deepspace1";
import { deepspace2 } from "./deepspace2";

export const skyboxes = {
  example,
  earth,
  sectoralpha,
  teegarden1,
  teegarden2,
  gaia,
  deepspace1,
  deepspace2,
};
export type SkyboxTexture = keyof typeof skyboxes;
