import { sum } from "mathjs";
import sortBy from "lodash/sortBy";
import { createShip, InitialShipInput } from "../archetypes/ship";
import { mineableCommodities } from "../economy/commodity";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { pickRandom } from "../utils/generators";
import { perCommodity } from "../utils/perCommodity";
import { shipClasses } from "../world/ships";
import { System } from "./system";
import { faction as asFaction } from "../archetypes/faction";
import { sector as asSector } from "../archetypes/sector";

export class ShipPlanningSystem extends System {
  cooldowns: Cooldowns<"exec">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
  }

  exec = (): void => {
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 1);

      this.sim.queries.shipyards.get().forEach((shipyard) => {});
    }
  };
}
