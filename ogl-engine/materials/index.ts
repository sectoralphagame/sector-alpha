import { AsteroidNewMaterial } from "./AsteroidNew/AsteroidNew";
import { AsteroidRockMaterial } from "./AsteroidRock/AsteroidRock";
import { ColorMaterial } from "./color/color";
import { PbrMaterial } from "./pbr/pbr";

export const materials = {
  pbr: PbrMaterial,
  default: ColorMaterial,
  asteroidNew: AsteroidNewMaterial,
  asteroidRock: AsteroidRockMaterial,
};
