import { Matrix, pow, sqrt, sum } from "mathjs";

export interface Point {
  x: number;
  y: number;
}

export interface PolarPoint {
  angle: number;
  r: number;
}

export function len(point: Point): number {
  return Math.sqrt(point.x ** 2 + point.y ** 2);
}

export function toPolar(point: Point): PolarPoint {
  return {
    angle: Math.atan2(point.y, point.x),
    r: len(point),
  };
}

export function toCartesian(point: PolarPoint): Point {
  return {
    x: point.r * Math.cos(point.angle),
    y: point.r * Math.sin(point.angle),
  };
}

export function add(a: Point, b: Point): Point {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function sub(a: Point, b: Point): Point {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function multiplyByScalar(point: Point, scalar: number): Point {
  return {
    x: point.x * scalar,
    y: point.y * scalar,
  };
}

export function divideByScalar(point: Point, scalar: number): Point {
  return {
    x: point.x / scalar,
    y: point.y / scalar,
  };
}

export function multiply(a: Point, b: Point): Point {
  return {
    x: a.x * b.x,
    y: a.y * b.y,
  };
}

export function rotate(point: Point, angle: number): Point {
  return {
    x: Math.cos(angle) * point.x - Math.sin(angle) * point.y,
    y: Math.sin(angle) * point.x + Math.cos(angle) * point.y,
  };
}

export function isInBounds(point: Point, bounds: Point[]): boolean {
  if (point.x > bounds[1].x || point.x < bounds[0].x) {
    return false;
  }
  if (point.y > bounds[1].y || point.y < bounds[0].y) {
    return false;
  }

  return true;
}

export function getRandomPositionInBounds(bounds: Point[]): Point {
  return {
    x: Math.random() * bounds[1].x,
    y: Math.random() * bounds[1].y,
  };
}
