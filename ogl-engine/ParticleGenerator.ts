import { Vec3, Transform, Plane, Quat, Mat4 } from "ogl";
import { BaseMesh } from "./engine/BaseMesh";
import type { Destroyable } from "./types";
import type { Engine3D } from "./engine/engine3d";
import type { OnBeforeRenderTask } from "./engine/task";

const scale = new Vec3();
const emptyQuat = new Quat();
const trs = new Mat4();
const tempVec3 = new Vec3();
const tempWorldScale = new Vec3();

interface Particle {
  angularVelocity: number;
  velocity: Vec3;
  acceleration: Vec3;
  life: number;
  position: Vec3;
  scale: Vec3;
  t: number;
}

type GenerateParticleFn = (_particle: Particle) => void;

export class ParticleGenerator extends Transform implements Destroyable {
  engine: Engine3D;
  name = "ParticleGenerator";
  particles: Particle[];

  protected max: number;
  spawnRate = 1;
  scheduledToDestroy = false;

  mesh: BaseMesh;
  /**
   * If true, particles will be spawned in world space, meaning they will not be
   * affected by future generator movements.
   */
  global = true;

  currentWindow: number;
  currentWindowSpawned = 0;
  lastKilled: number | null = 0;

  onParticleUpdate: ((_particle: Particle, _time: number) => void) | null =
    null;

  protected generate: GenerateParticleFn;
  private task: OnBeforeRenderTask;

  constructor(engine: Engine3D, generate: GenerateParticleFn, max = 1000) {
    super();
    this.engine = engine;
    this.max = max;
    this.particles = [];
    this.generate = generate;
    this.currentWindow = 0;
    this.mesh = this.createParticleMesh();
    this.generateParticles();
  }

  generateParticles() {
    for (let i = 0; i < this.max; i++) {
      this.createParticle();
    }
  }

  requestParticle(): Particle {
    let particle = this.particles[0];
    for (let i = this.lastKilled ?? 0; i < this.particles.length; i++) {
      if (this.particles[i].life <= 0) {
        particle = this.particles[i];
        this.lastKilled = null;
        break;
      }
    }

    particle.acceleration.set(0);
    particle.velocity.set(0);
    particle.position.set(0);
    particle.angularVelocity = 0;
    particle.t = 0;

    return particle;
  }

  createParticleMesh(): BaseMesh {
    const mesh = new BaseMesh(this.engine, {
      geometry: new Plane(this.engine.gl),
    });

    mesh.geometry.addAttribute("instanceMatrix", {
      instanced: true,
      size: 16,
      data: new Float32Array(this.max * 16),
      usage: this.engine.gl.DYNAMIC_DRAW,
    });
    mesh.geometry.addAttribute("instanceIndex", {
      instanced: true,
      size: 1,
      data: new Uint16Array(this.max).map((_, i) => i),
    });
    mesh.geometry.addAttribute("t", {
      instanced: true,
      size: 1,
      data: new Float32Array(this.max),
    });
    mesh.frustumCulled = false;
    mesh.setParent(this);
    mesh.geometry.setInstancedCount(this.max);

    this.task = this.engine.addOnBeforeRenderTask(() => {
      this.update(this.engine.delta);
    });

    return mesh;
  }

  createParticle(): Particle {
    const particle = {
      angularVelocity: 0,
      acceleration: new Vec3(0),
      life: 0,
      velocity: new Vec3(0),
      position: new Vec3(0),
      scale: new Vec3(0),
      t: 0,
    };
    this.particles.push(particle);
    return particle;
  }

  generateParticle() {
    const particle = this.requestParticle();

    this.generate(particle);

    if (this.global) {
      particle.position.applyMatrix4(this.worldMatrix);
    }
    particle.acceleration.scaleRotateMatrix4(this.worldMatrix);
    particle.velocity.scaleRotateMatrix4(this.worldMatrix);
  }

  update(time: number) {
    this.currentWindow += time;
    if (this.currentWindow >= 1000) {
      this.currentWindow = 0;
      this.currentWindowSpawned = 0;
    }

    const percentage = this.currentWindow;
    const particlesToSpawn = Math.ceil(
      this.spawnRate * percentage - this.currentWindowSpawned
    );

    if (!this.scheduledToDestroy) {
      for (let i = 0; i < particlesToSpawn; i++) {
        this.generateParticle();
        this.currentWindowSpawned++;
        this.lastKilled = null;
      }
    }

    this.worldMatrix.getScaling(tempWorldScale);

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (particle.life <= 0) {
        continue;
      }

      this.onParticleUpdate?.(particle, time);

      particle.position.add(tempVec3.copy(particle.velocity).multiply(time));
      particle.velocity.add(
        tempVec3.copy(particle.acceleration).multiply(time)
      );
      scale.set(particle.scale).multiply(tempWorldScale);
      //   particle.mesh.rotation.y += particle.angularVelocity * time;
      particle.life -= time;

      if (particle.life <= 0) {
        scale.set([0, 0, 0], i * 3);
        if (!this.lastKilled) {
          this.lastKilled = i;
        }
        continue;
      }

      trs
        .compose(emptyQuat, particle.position, scale)
        .toArray(this.mesh.geometry.attributes.instanceMatrix.data!, i * 16);

      this.mesh.geometry.attributes.t.data!.set([particle.t], i);
    }

    this.mesh.geometry.attributes.instanceMatrix.needsUpdate = true;
    this.mesh.geometry.attributes.t.needsUpdate = true;

    if (this.scheduledToDestroy && this.particles.every((p) => p.life <= 0)) {
      this.destroy();
      this.setParent(null);
    }
  }

  markForDestruction() {
    this.scheduledToDestroy = true;
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this.task.cancel();
    this.mesh.setParent(null);
  }
}

export abstract class OneShotParticleGenerator extends ParticleGenerator {
  private count = 0;

  override generateParticle(): void {
    if (this.count >= this.max) return;

    super.generateParticle();
    this.count++;
  }

  override update(time: number) {
    super.update(time);
    if (this.count > 0 && this.particles.every((p) => p.life <= 0)) {
      this.markForDestruction();
    }
  }
}
