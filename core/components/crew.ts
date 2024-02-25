import type { BaseComponent } from "./component";

export const minMood = 0;
export const maxMood = 100;
export interface Crew extends BaseComponent<"crew"> {
  workers: {
    current: number;
    max: number;
  };
  /**
   * Mood is a number between 0 and 100, where 0 is the worst mood and 100 is the best.
   */
  mood: number;
}
