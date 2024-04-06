/* eslint-disable no-restricted-globals */

import { Sim } from "@core/sim";
import { createBaseConfig } from "@core/sim/baseConfig";

export interface HeadlessSimUpdateMsg {
  type: "update";
  time: number;
}

export interface HeadlessSimCompletedeMsg {
  type: "completed";
  data: string;
}

export interface HeadlessSimInitMsg {
  type: "init";
  sim: string;
  targetTime: number;
  delta: number;
}

export type HeadlessSimMsg = HeadlessSimUpdateMsg | HeadlessSimCompletedeMsg;

self.onmessage = async (event: MessageEvent<HeadlessSimInitMsg>) => {
  const sim = Sim.load(await createBaseConfig(), event.data.sim);

  let cycles = 0;

  while (sim.getTime() < event.data.targetTime) {
    sim.next(event.data.delta);

    cycles++;
    if (cycles === 10) {
      cycles = 0;
      self.postMessage({
        time: sim.getTime(),
        type: "update",
      } as HeadlessSimUpdateMsg);
    }
  }

  self.postMessage({
    data: sim.serialize(),
    type: "completed",
  } as HeadlessSimCompletedeMsg);
};
