import { clone } from "mathjs";
import { createShip } from "../archetypes/ship";
import { Commodity } from "../economy/commodity";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { System } from "./system";
import { Faction } from "../archetypes/faction";
import { Sector } from "../archetypes/sector";
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
            ...shipyard.cp.shipyard.building.blueprint,
            position: clone(shipyard.cp.position.coord),
            sector: this.sim.getOrThrow<Sector>(shipyard.cp.position.sector),
            owner: this.sim.getOrThrow<Faction>(
              shipyard.cp.shipyard.building.owner
            ),
            name: `${this.sim.getOrThrow<Faction>(
              shipyard.cp.shipyard.building.owner
            ).cp.name.slug!} ${shipyard.cp.shipyard.building.blueprint.name}`,
          });
          dockShip(ship, shipyard);
          shipyard.cp.journal.entries.push({
            type: "shipyard",
            faction: shipyard.cp.shipyard.building.owner,
            name: ship.cp.name.value,
            price: 0,
            time: this.sim.getTime(),
          });
          shipyard.cp.shipyard.building = null;
        }

        if (shipyard.cp.shipyard.queue.length === 0) return;
        const shipToBuild = shipyard.cp.shipyard.queue[0];

        if (
          Object.entries(shipToBuild.blueprint.build.cost).every(
            ([commodity, quantity]: [Commodity, number]) =>
              hasSufficientStorage(shipyard.cp.storage, commodity, quantity)
          )
        ) {
          Object.entries(shipToBuild.blueprint.build.cost).forEach(
            ([commodity, quantity]: [Commodity, number]) =>
              removeStorage(shipyard.cp.storage, commodity, quantity)
          );
          shipyard.cooldowns.use(buildTimer, shipToBuild.blueprint.build.time);
          shipyard.cp.shipyard.queue.splice(0, 1);
          shipyard.cp.shipyard.building = shipToBuild;
        }
      });
    }
  };
}
