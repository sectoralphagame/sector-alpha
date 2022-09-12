import { clone, sum } from "mathjs";
import sortBy from "lodash/sortBy";
import { createShip, InitialShipInput } from "../archetypes/ship";
import { Commodity, mineableCommodities } from "../economy/commodity";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { pickRandom } from "../utils/generators";
import { perCommodity } from "../utils/perCommodity";
import { shipClasses } from "../world/ships";
import { System } from "./system";
import { faction as asFaction, Faction } from "../archetypes/faction";
import { sector as asSector, Sector } from "../archetypes/sector";
import { hasSufficientStorage, removeStorage } from "../components/storage";
import { dockShip } from "./orderExecuting/dock";

const buildTimer = "shipBuild";

export class ShipBuildingSystem extends System {
  cooldowns: Cooldowns<"exec">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 1);

      this.sim.queries.shipyards.get().forEach((shipyard) => {
        if (!shipyard.cooldowns.canUse(buildTimer)) return;

        if (shipyard.cp.shipyard.building) {
          const ship = createShip(this.sim, {
            ...shipyard.cp.shipyard.building,
            position: clone(shipyard.cp.position.coord),
            sector: this.sim.getOrThrow<Sector>(shipyard.cp.position.sector),
            owner: this.sim.getOrThrow<Faction>(shipyard.cp.owner!.id),
          });
          dockShip(ship, shipyard);
          shipyard.cp.shipyard.building = null;
        }

        if (shipyard.cp.shipyard.queue.length === 0) return;
        const shipToBuild = shipyard.cp.shipyard.queue[0];

        if (
          Object.entries(shipToBuild.build.cost).every(
            ([commodity, quantity]: [Commodity, number]) =>
              hasSufficientStorage(shipyard.cp.storage, commodity, quantity)
          )
        ) {
          Object.entries(shipToBuild.build.cost).forEach(
            ([commodity, quantity]: [Commodity, number]) =>
              removeStorage(shipyard.cp.storage, commodity, quantity)
          );
          shipyard.cooldowns.use(buildTimer, shipToBuild.build.time);
          shipyard.cp.shipyard.queue.splice(0, 1);
          shipyard.cp.shipyard.building = shipToBuild;
        }
      });
    }
  };
}
