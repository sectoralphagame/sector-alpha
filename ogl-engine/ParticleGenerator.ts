import { Vec3, Transform } from "ogl";
import type { Engine } from "./engine/engine";
import { Billboard } from "./utils/billboard";

interface Particle {
  angularVelocity: number;
  velocity: Vec3;
  acceleration: Vec3;
  life: number;
  mesh: Transform;
}

type GenerateParticleFn = (_particle: Particle) => void;

export class ParticleGenerator extends Transform {
  engine: Engine;
  particles: Particle[];

  max = 100;
  spawnRate = 1;

  currentWindowTimestamp: number;
  currentWindowSpawned = 0;

  onParticleUpdate: ((_particle: Particle, _time: number) => void) | null =
    null;

  protected generate: GenerateParticleFn;

  constructor(engine: Engine, generate: GenerateParticleFn) {
    super();
    this.engine = engine;
    this.particles = [];
    this.generate = generate;
    this.currentWindowTimestamp = performance.now();
  }

  requestParticle(): Particle | null {
    for (const particle of this.particles) {
      if (particle.life < 0) {
        particle.acceleration = new Vec3(0);
        particle.velocity = new Vec3(0);
        particle.angularVelocity = 0;
        particle.mesh.visible = true;

        return particle;
      }
    }

    return null;
  }

  createParticleMesh(): Transform {
    const mesh = new Billboard(this.engine, new Vec3(1), false);
    mesh.setParent(this.engine.scene);

    return mesh;
  }

  createParticle(): Particle {
    return {
      angularVelocity: 0,
      acceleration: new Vec3(0),
      life: 0,
      velocity: new Vec3(0),
      mesh: this.createParticleMesh(),
    };
  }

  generateParticle() {
    let particle = this.requestParticle();
    if (!particle) {
      if (this.particles.length >= this.max) return;
      particle = this.createParticle();
      this.particles.push(particle);
    }
    particle.mesh.position.set(this.position);

    this.generate(particle);
  }

  update(time: number) {
    const now = performance.now();
    if (now - this.currentWindowTimestamp >= 1000) {
      this.currentWindowTimestamp = now;
      this.currentWindowSpawned = 0;
    }

    const percentage = (now - this.currentWindowTimestamp) / 1000;
    const particlesToSpawn = Math.floor(
      this.spawnRate * percentage - this.currentWindowSpawned
    );

    for (let i = 0; i < particlesToSpawn; i++) {
      this.generateParticle();
      this.currentWindowSpawned++;
    }

    for (const particle of this.particles) {
      if (!particle.mesh.visible) {
        continue;
      }

      this.onParticleUpdate?.(particle, time);
      particle.mesh.position.add(particle.velocity.clone().multiply(time));
      particle.velocity.add(particle.acceleration.clone().multiply(time));
      particle.mesh.rotation.y += particle.angularVelocity * time;
      particle.life -= time;
    }

    for (const particle of this.particles) {
      if (particle.life <= 0) {
        particle.mesh.visible = false;
      }
    }
  }
}
