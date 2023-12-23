import settings from "@core/settings";
import { Sim } from "@core/sim";
import { bootstrapSystems } from "@core/sim/baseConfig";
import { getFixedWorld as world } from "@core/world";
import fs from "fs";

const sim = new Sim({
  systems: bootstrapSystems,
});
sim.init();

world(sim).then(() => {
  let cycles = 0;
  const delta = 1;
  console.log("Starting...");

  while (sim.getTime() < settings.bootTime) {
    sim.next(delta);

    cycles++;
    if (cycles === 10) {
      console.log(`${((sim.getTime() / settings.bootTime) * 100).toFixed(2)}%`);
      cycles = 0;
    }
  }

  console.log("Saving...");
  fs.writeFileSync("core/world/data/base.json", sim.serialize());
  console.log("Done!");
});
