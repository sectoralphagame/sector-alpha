import { SmokeParticleGenerator } from "./smoke";
import { FireParticleGenerator } from "./fire";
import { EngineParticleGenerator } from "./engine";
import { HyperSlingshotParticleGenerator } from "./hyperslingshot";
import { KineticGunParticleGenerator } from "./kineticGun";

export {
  SmokeParticleGenerator,
  FireParticleGenerator,
  EngineParticleGenerator,
};

export const particleGenerator = {
  smoke: SmokeParticleGenerator,
  fire: FireParticleGenerator,
  engine: EngineParticleGenerator,
  hyperslingshot: HyperSlingshotParticleGenerator,
  kineticGun: KineticGunParticleGenerator,
};
export type ParticleGeneratorType = keyof typeof particleGenerator;

export function getParticleType(v: string): ParticleGeneratorType | null {
  return (v.match(/_particle_([^_]+)/)?.[1] as ParticleGeneratorType) ?? null;
}
