import { sum } from "mathjs";
import sortBy from "lodash/sortBy";
import { createShip, InitialShipInput } from "../archetypes/ship";
import { mineableCommodities } from "../economy/commodity";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { pickRandom } from "../utils/generators";
import { perCommodity } from "../utils/perCommodity";
import { ShipRole } from "../world/ships";
import { System } from "./system";
import { Faction } from "../archetypes/faction";
import { sector as asSector } from "../archetypes/sector";
import { Entity } from "../components/entity";
import { RequireComponent } from "../tsHelpers";
import { notNull } from "../utils/maps";

export function requestShip(
  faction: Faction,
  shipyard: RequireComponent<"shipyard" | "position">,
  role: ShipRole,
  queue: boolean
): Omit<InitialShipInput, "position" | "owner" | "sector"> {
  const bp = pickRandom(
    faction.cp.blueprints.ships.filter((ship) => ship.role === role)
  );

  if (queue || Math.random() < 0.1) {
    shipyard.cp.shipyard.queue.push({
      blueprint: bp,
      owner: faction.id,
    });
  } else {
    createShip(faction.sim, {
      ...bp,
      position: shipyard.cp.position.coord.clone(),
      owner: faction,
      sector: asSector(shipyard.sim.getOrThrow(shipyard.cp.position.sector)),
      name: `${faction.cp.name.slug!} ${bp.name}`,
    });
  }

  return bp;
}

export class ShipPlanningSystem extends System {
  cooldowns: Cooldowns<"plan">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("plan");
  }

  getShipRequests = (faction: Faction) =>
    this.sim.queries.facilities
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
        const shipsForShipyards = facility.cp.shipyard ? 1 : 0;

        const currentMiningSpeed: number = sum(
          miners.map((miner) => miner.cp.mining.efficiency)
        );

        const mining =
          Object.entries(production)
            .filter(
              ([commodity, commodityProduction]) =>
                commodityProduction < 0 &&
                (Object.values(mineableCommodities) as string[]).includes(
                  commodity
                )
            )
            .reduce(
              (m, [, commodityProduction]) => m + commodityProduction,
              0
            ) + currentMiningSpeed;

        const shipsForProduction =
          Math.floor(
            Object.entries(production).filter(
              ([commodity, commodityUsage]) =>
                !(Object.values(mineableCommodities) as string[]).includes(
                  commodity
                ) && commodityUsage !== 0
            ).length / 1.5
          ) || 1;

        const trading =
          traders.length - (shipsForProduction + shipsForShipyards);

        return { facility, mining, trading };
      });

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("plan")) {
      this.cooldowns.use("plan", 60);

      this.sim.queries.ai.get().forEach((faction) => {
        const shipRequests = this.getShipRequests(faction);
        const requestsInShipyards = this.sim.queries.shipyards
          .get()
          .flatMap((shipyard) =>
            [
              ...shipyard.cp.shipyard.queue,
              shipyard.cp.shipyard.building,
            ].filter(notNull)
          );
        const shipyard =
          this.sim.queries.shipyards
            .get()
            .find((s) => s.cp.owner.id === faction.id) ??
          pickRandom(this.sim.queries.shipyards.get());

        const spareTraders: Entity[] = shipRequests
          .filter((request) => request.trading > 0)
          .flatMap(({ facility, trading }) =>
            this.sim.queries.commendables
              .get()
              .filter(
                (ship) =>
                  ship.cp.commander.id === facility.id && !ship.cp.mining
              )
              .slice(0, trading)
          );
        spareTraders.forEach((ship) => {
          ship.removeComponent("commander");
        });
        spareTraders.push(
          ...this.sim.queries.orderable
            .get()
            .filter(
              (ship) =>
                ship.cp.owner?.id === faction.id &&
                !ship.cp.commander &&
                !ship.cp.mining
            )
        );

        const tradingShipRequestInShipyards = requestsInShipyards.filter(
          (queued) => queued && !queued?.blueprint.mining
        );

        shipRequests
          .filter(({ trading }) => trading < 0)
          .forEach(({ facility, trading }) => {
            Array(-trading)
              .fill(0)
              .forEach(() => {
                if (spareTraders.length > 0) {
                  const ship = spareTraders.pop()!;
                  ship.addComponent({
                    name: "commander",
                    id: facility.id,
                  });
                } else if (tradingShipRequestInShipyards.length > 0) {
                  tradingShipRequestInShipyards.pop();
                } else {
                  requestShip(
                    faction,
                    shipyard,
                    "transport",
                    this.sim.getTime() > 0
                  );
                }
              });
          });

        const spareMiners: Entity[] = shipRequests
          .filter((request) => request.mining >= 1)
          .flatMap(({ facility, mining }) => {
            const miners = sortBy(
              this.sim.queries.commendables
                .get()
                .filter(
                  (ship) =>
                    ship.cp.commander.id === facility.id && ship.cp.mining
                ),
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
        spareMiners.push(
          ...this.sim.queries.mining
            .get()
            .filter(
              (ship) => ship.cp.owner?.id === faction.id && !ship.cp.commander
            )
        );

        const miningShipRequests = shipRequests.filter(
          ({ mining }) => mining < 0
        );

        if (miningShipRequests.length === 0) return;

        const miningShipRequestInShipyards = requestsInShipyards.filter(
          (queued) => queued?.blueprint.mining
        );

        miningShipRequests.forEach(({ facility, mining }) => {
          while (mining < 0) {
            if (spareMiners.length > 0) {
              const ship = spareMiners.pop()!;
              ship.addComponent({
                name: "commander",
                id: facility.id,
              });
              mining += ship.cp.mining!.efficiency;
            } else if (miningShipRequestInShipyards.length > 0) {
              mining += miningShipRequestInShipyards.pop()!.blueprint.mining;
            } else {
              const bp = requestShip(
                faction,
                shipyard,
                "mining",
                this.sim.getTime() > 0
              );
              mining += bp.mining;
            }
          }
        });
      });
    }
  };
}
