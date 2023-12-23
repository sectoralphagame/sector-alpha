import settings from "@core/settings";
import { Sim } from "@core/sim";
import { createBaseConfig } from "@core/sim/baseConfig";
import { getFixedWorld as world } from "@core/world";
import fs from "fs";

const sim = new Sim(createBaseConfig());
sim.init();

world(sim).then(() => {
  let cycles = 0;
  const delta = 1;
  for (let i = sim.getTime(); i < settings.bootTime; i += delta) {
    sim.next(delta);

    cycles++;
    if (cycles === 10) {
      cycles = 0;
      console.log(`${((sim.getTime() / settings.bootTime) * 100).toFixed(2)}%`);
    }

    fs.writeFileSync("src/world/data/base.json", sim.serialize());
  }
});
