/* eslint-disable no-restricted-globals */

import { Sim } from "../sim";

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

self.onmessage = (event: MessageEvent<HeadlessSimInitMsg>) => {
  const sim = Sim.load(event.data.sim);

  let cycles = 0;
  for (
    let i = sim.getTime();
    i < event.data.targetTime;
    i += event.data.delta
  ) {
    sim.next(event.data.delta);

    cycles++;
    if (cycles === 100) {
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
