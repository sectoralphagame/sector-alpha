import type { BaseComponent } from "./component";

export interface BaseModifier {
  name: string;
}

export interface SpeedModifier extends BaseModifier {
  type: "speed";
  value: number;
}

export interface DamageModifier extends BaseModifier {
  type: "damage";
  value: number;
}

export interface HitPointsModifier extends BaseModifier {
  type: "hitpoints";
  value: number;
}

export interface ShieldModifier extends BaseModifier {
  type: "shield";
  value: number;
}

export type Modifier =
  | SpeedModifier
  | DamageModifier
  | HitPointsModifier
  | ShieldModifier;

export interface Modifiers extends BaseComponent<"modifiers"> {
  modifiers: Modifier[];
}
