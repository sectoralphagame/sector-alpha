/* eslint-disable no-console */
import { bootstrapSystems } from "@core/sim/baseConfig";
import { getFixedWorld as world } from "@core/world";
import fs from "fs";
import progress from "cli-progress";
import { settings } from "@core/settings";
import { Sim } from "../core/sim/Sim";

const sim = new Sim({
  systems: bootstrapSystems,
});
sim.init();

world(sim).then(() => {
  let cycles = 0;
  const delta = 1;
  console.log("Starting...");
  const bar = new progress.SingleBar({}, progress.Presets.rect);
  bar.start(settings.bootTime, 0);

  while (sim.getTime() < settings.bootTime) {
    sim.next(delta);

    cycles++;
    if (cycles === 10) {
      bar.update(sim.getTime());
      cycles = 0;
    }
  }

  bar.stop();
  console.log("Saving...");
  fs.writeFileSync("core/world/data/base.json", sim.serialize());
  console.log("Done!");
});
