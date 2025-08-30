import { lerp } from "@core/utils/misc";

type Point = [number, number];
export type Timeline = (_t: number) => number;

export function createTimeline(points: Point[]): Timeline {
  if (points.length < 2) {
    throw new Error("At least two points are required to create a timeline.");
  }

  return (t) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [tStart, vStart] = points[i];
      const [tEnd, vEnd] = points[i + 1];

      if (t >= tStart && t <= tEnd) {
        return lerp(vStart, vEnd, (t - tStart) / (tEnd - tStart));
      }
    }

    return points[points.length - 1][1];
  };
}
