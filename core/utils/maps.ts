import Color from "color";
import type { Vec3 } from "ogl";

export function notNull<T>(v: T | null): v is T {
  return v !== null;
}

export function discriminate<
  K extends PropertyKey,
  V extends string | number | boolean
>(discriminantKey: K, discriminantValue: V) {
  return <T extends Record<K, any>>(
    obj: T & Record<K, V extends T[K] ? T[K] : V>
  ): obj is Extract<T, Record<K, V>> =>
    obj[discriminantKey] === discriminantValue;
}

export function colorToVec3(color: string, vec: Vec3) {
  const c = Color(color).rgb().array();
  vec.set(c[0], c[1], c[2]).divide(255);
}
