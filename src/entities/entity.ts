import { Rect } from "@timohausmann/quadtree-js";
import { limit } from "../utils/limit";
import { notImplemented } from "../errors";
import { add, len, multiply, multiplyByScalar, Point, sub } from "../r2";
import settings from "../settings";
import type { Sim } from "../sim";

export interface InitialEntityInput {
  position: Point;
}

const maxSpeed = 800;

function limitVector(vec: Point, max: number): Point {
  return {
    x: limit(vec.x, -max, max),
    y: limit(vec.y, -max, max),
  };
}

export class Entity<TInput = any> implements Rect {
  age: number;
  id: number;
  createdAt: number;
  position: Point;
  size: Point;
  shouldDelete: boolean;
  velocity: Point;
  acceleration: Point;
  mass: number;
  forces: Point[];
  friction: number;
  allowDying: boolean;

  get x(): number {
    return this.position.x;
  }

  get y(): number {
    return this.position.y;
  }

  get width(): number {
    return this.size.x;
  }

  get height(): number {
    return this.size.y;
  }

  constructor(initial: InitialEntityInput) {
    this.age = 0;
    this.position = { ...initial.position };
    this.shouldDelete = false;
    this.size = { x: 1, y: 1 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.mass = 1;
    this.friction = settings.global.friction;
    this.forces = [];
    this.allowDying = true;
  }

  markToDelete = () => {
    this.shouldDelete = true;
  };

  // eslint-disable-next-line class-methods-use-this
  die(): Entity[] {
    if (this.allowDying) {
      this.markToDelete();
    }

    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  copy(): Entity<TInput> {
    throw notImplemented;
  }

  // eslint-disable-next-line class-methods-use-this
  load(): Entity<TInput> {
    throw notImplemented;
  }

  // eslint-disable-next-line no-unused-vars
  onSim(delta: number, input: TInput): Entity[] {
    this.age += delta;

    if (this.forces.map(len).some((force) => force > 1e4)) {
      this.die();
    }

    return [];
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onEvery(delta: number): void {
    this.applyPhysics(delta);
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  getSimInput(sim: Sim): TInput {
    return null;
  }

  applyPhysics = (delta: number) => {
    const positionDelta = add(
      multiplyByScalar(this.velocity, delta),
      multiplyByScalar(this.acceleration, delta ** 2 / 2)
    );

    const drag: Point = multiplyByScalar(
      multiply(this.velocity, {
        x: Math.abs(this.velocity.x),
        y: Math.abs(this.velocity.y),
      }),
      this.friction / 2
    );
    const acceleration = multiplyByScalar(
      sub(this.forces.reduce(add, { x: 0, y: 0 }), drag),
      this.mass
    );

    const velocity = limitVector(
      add(
        this.velocity,
        multiplyByScalar(add(this.acceleration, acceleration), delta / 2)
      ),
      maxSpeed * delta
    );

    this.position = add(this.position, positionDelta);
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.forces = [];
  };
}
