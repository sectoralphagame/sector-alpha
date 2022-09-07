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

export function getFreighterTemplate() {
  const rnd = Math.random();

  if (rnd > 0.9) {
    return pickRandom(
      shipClasses.filter((s) => !s.mining && s.size === "large")
    );
  }

  if (rnd > 0.1) {
    return pickRandom(
      shipClasses.filter((s) => !s.mining && s.size === "medium")
    );
  }

  return pickRandom(shipClasses.filter((s) => !s.mining && s.size === "small"));
}

export function requestShip(
  type: "mining" | "trading"
): Omit<InitialShipInput, "position" | "owner" | "sector"> {
  switch (type) {
    case "mining":
      return shipClasses.filter((s) => s.mining)[Math.random() > 0.5 ? 1 : 0];
    default:
      return getFreighterTemplate();
  }
}

export class ShipPlanningSystem extends System {
  cooldowns: Cooldowns<"plan">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("plan");
  }

  exec = (): void => {
    // TODO: remove time limitation after introducing shipyards
    if (this.cooldowns.canUse("plan") && this.sim.getTime() === 0) {
      this.cooldowns.use("plan", 500);

      this.sim.queries.ai.get().forEach((faction) => {
        const shipRequests = this.sim.queries.facilityWithProduction
          .get()
          .filter((facility) => facility.cp.owner?.id === faction.id)
          .map((facility) => {
            const facilityModules = facility.cp.modules.ids.map(
              this.sim.getOrThrow
            );
            const facilityShips = this.sim.queries.commendables
              .get()
              .filter((ship) => ship.cp.commander.id === facility.id);
            const miners = facilityShips
              .filter((ship) => ship.cp.mining)
              .map((miner) => miner.requireComponents(["commander", "mining"]));
            const traders = facilityShips.filter((ship) => !ship.cp.mining);
            const production = perCommodity((commodity) =>
              facilityModules
                .filter(
                  (fm) =>
                    fm.cp.production &&
                    (fm.cp.production.pac[commodity].consumes > 0 ||
                      fm.cp.production.pac[commodity].produces > 0)
                )
                .reduce(
                  (b, fm) =>
                    b +
                    (fm.cp.production!.pac[commodity].produces -
                      fm.cp.production!.pac[commodity].consumes) /
                      3600,
                  0
                )
            );

            const currentMiningSpeed: number = miners
              .map((miner) => miner.cp.mining.efficiency)
              .reduce(sum, 0);

            const mining =
              Object.entries(production)
                .filter(([commodity]) =>
                  (Object.values(mineableCommodities) as string[]).includes(
                    commodity
                  )
                )
                .reduce((m, [, usage]) => m + usage, 0) + currentMiningSpeed;
            const trading =
              -(
                Math.floor(
                  Object.entries(production).filter(
                    ([commodity]) =>
                      !(
                        Object.values(mineableCommodities) as string[]
                      ).includes(commodity) && production[commodity] !== 0
                  ).length / 1.5
                ) || 1
              ) + traders.length;

            return { facility, mining, trading };
          });

        const spareTraders = shipRequests
          .filter((request) => request.trading > 0)
          .flatMap(({ facility, trading }) =>
            this.sim.queries.commendables
              .get()
              .filter((ship) => ship.cp.commander.id === facility.id)
              .filter((ship) => !ship.cp.mining)
              .slice(0, trading)
          );
        spareTraders.forEach((ship) => {
          ship.removeComponent("commander");
        });

        shipRequests
          .filter(({ trading }) => trading < 0)
          .forEach(({ facility, trading }) => {
            Array(-trading)
              .fill(0)
              .forEach(() => {
                const ship =
                  spareTraders.length > 0
                    ? spareTraders.pop()!
                    : createShip(this.sim, {
                        ...requestShip("trading"),
                        position: facility.cp.position.coord.clone(),
                        owner: asFaction(
                          this.sim.getOrThrow(facility.cp.owner!.id)
                        ),
                        sector: asSector(
                          this.sim.getOrThrow(facility.cp.position.sector)
                        ),
                      });
                ship.addComponent({
                  name: "commander",
                  id: facility.id,
                });
              });
          });

        const spareMiners = shipRequests
          .filter((request) => request.mining > 0)
          .flatMap(({ facility, mining }) => {
            const miners = sortBy(
              this.sim.queries.commendables
                .get()
                .filter((ship) => ship.cp.commander.id === facility.id)
                .filter((ship) => !ship.cp.mining),
              (ship) => ship.cp.mining!.efficiency
            );
            const sliceIndex = miners.reduce(
              ({ current, index }, ship, shipIndex) => {
                if (
                  current < mining &&
                  ship.cp.mining!.efficiency <= mining - current
                ) {
                  return {
                    index: shipIndex,
                    current: current + ship.cp.mining!.efficiency,
                  };
                }

                return { index, current };
              },
              { index: -1, current: 0 }
            ).index;

            return miners.slice(0, sliceIndex);
          });
        spareMiners.forEach((ship) => {
          ship.removeComponent("commander");
        });

        shipRequests
          .filter(({ mining }) => mining < 0)
          .forEach(({ facility, mining }) => {
            while (mining < 0) {
              const ship =
                spareMiners.length > 0
                  ? spareMiners.pop()!
                  : createShip(this.sim, {
                      ...requestShip("mining"),
                      position: facility.cp.position.coord.clone(),
                      owner: asFaction(
                        this.sim.getOrThrow(facility.cp.owner!.id)
                      ),
                      sector: asSector(
                        this.sim.getOrThrow(facility.cp.position.sector)
                      ),
                    });
              ship.addComponent({
                name: "commander",
                id: facility.id,
              });

              mining += ship.cp.mining!.efficiency;
            }
          });
      });
    }
  };
}
