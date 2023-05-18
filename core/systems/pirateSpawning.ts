import type { Faction } from "@core/archetypes/faction";
import type { Sector } from "@core/archetypes/sector";
import { sectorSize } from "@core/archetypes/sector";
import type { Ship, ShipComponent } from "@core/archetypes/ship";
import { createShip, shipComponents } from "@core/archetypes/ship";
import { hecsToCartesian } from "@core/components/hecsPosition";
import { addSubordinate } from "@core/components/subordinates";
import { isDev } from "@core/settings";
import type { Sim } from "@core/sim";
import { pickRandom } from "@core/utils/generators";
import { moveToActions } from "@core/utils/moving";
import { shipClasses } from "@core/world/ships";
import type { Matrix } from "mathjs";
import { add, distance, randomInt } from "mathjs";
import { System } from "./system";
import { Query } from "./utils/query";

function returnToFlagship(unassigned: Ship[], flagships: Ship[]) {
  if (unassigned.length && flagships.length) {
    unassigned.forEach((ship) => {
      if (ship.cp.orders.value.length || ship.cp.dockable.dockedIn) return;

      const closestFlagship = flagships.reduce((prev, cur) => {
        if (ship.cp.position.sector === cur.cp.position.sector) return cur;
        if (
          distance(prev.cp.position.coord, ship.cp.position.coord) >
          distance(cur.cp.position.coord, ship.cp.position.coord)
        )
          return cur;
        return prev;
      }, flagships[0]);

      ship.cp.orders.value = [
        {
          type: "dock",
          actions: [
            ...moveToActions(ship, closestFlagship),
            {
              type: "dock",
              targetId: closestFlagship.id,
            },
          ],
          origin: "auto",
        },
      ];
    });
  }
}

function spawnFlagship(sim: Sim, faction: Faction, flagships: Ship[]) {
  if (flagships.length > 6) return;

  const tau = sim.queries.ai.get().find((f) => f.cp.name.slug === "TAU")!;
  const sector = pickRandom(
    sim.queries.sectors
      .get()
      .filter(
        (s) =>
          flagships.every((f) => f.cp.position.sector !== s.id) &&
          s.cp.owner?.id !== tau.id
      )
  );

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`Spawning pirate flagship in ${sector.cp.name.value}`);
  }

  const angle = Math.random() * 2 * Math.PI;
  const r = ((1 + Math.random() / 5) * sectorSize) / 15;
  createShip(sim, {
    ...shipClasses.find((sc) => sc.slug === "seahorse")!,
    owner: faction,
    sector,
    angle: Math.random() * 2 * Math.PI,
    position: add(
      hecsToCartesian(sector.cp.hecsPosition.value, sectorSize / 10),
      [Math.cos(angle) * r, Math.sin(angle) * r]
    ) as Matrix,
  });
}

function spawnSquad(
  sim: Sim,
  faction: Faction,
  squads: Array<{ commander: Ship; subordinates: Ship[] }>,
  flagships: Ship[],
  unassigned: Ship[]
) {
  if (!flagships.length || squads.length > 13) return;

  const flagship = pickRandom(flagships);
  const unassignedInSector = unassigned.filter(
    (s) => s.cp.position.sector === flagship.cp.position.sector
  );
  const squadSize = randomInt(2, 4);
  const squad = unassignedInSector.slice(0, squadSize);
  const currentSquadSize = squad.length;
  const sector = sim.getOrThrow<Sector>(flagship.cp.position.sector);
  for (let index = 0; index < squadSize - currentSquadSize; index++) {
    squad.push(
      createShip(sim, {
        ...shipClasses.find((sc) => sc.slug === "roach")!,
        owner: faction,
        position: flagship.cp.position.coord.clone(),
        sector,
      })
    );
  }

  if (
    !squad.some((s) => s.cp.model.slug === "stingray") &&
    Math.random() > 0.8
  ) {
    squad.push(
      createShip(sim, {
        ...shipClasses.find((sc) => sc.slug === "stingray")!,
        owner: faction,
        position: flagship.cp.position.coord.clone(),
        sector,
      })
    );
  }

  const commander =
    squad.find((s) => s.cp.model.slug === "stingray") ?? pickRandom(squad);
  squad.forEach((s) => {
    if (s !== commander) {
      addSubordinate(commander, s);
      s.cp.autoOrder.default = {
        type: "escort",
        targetId: commander.id,
      };
    }
  });

  commander.cp.autoOrder.default = {
    type: "pillage",
    clockwise: Math.random() > 0.5,
    sectorId: commander.cp.position.sector,
  };

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`Launching ${squad.length} pirates in ${sector.cp.name.value}`);
  }
}

export class PirateSpawningSystem extends System<
  "return" | "spawnFlagship" | "spawnSquad"
> {
  faction: Faction;
  query: Query<ShipComponent>;

  apply = (sim: Sim) => {
    super.apply(sim);

    this.query = new Query<ShipComponent>(sim, shipComponents, [
      "role:military",
    ]);

    sim.hooks.phase.start.tap(this.constructor.name, () => {
      if (!this.faction) {
        this.faction = sim.queries.ai
          .get()
          .find((f) => f.cp.name.slug === "PIR")!;
      }
    });

    sim.hooks.phase.update.tap(this.constructor.name, (delta) => {
      this.cooldowns.update(delta);

      const squads = this.query
        .get()
        .filter(
          (s) =>
            s.cp.owner?.id === this.faction.id &&
            !s.cp.commander &&
            s.cp.subordinates.ids.length > 0
        )
        .map((s) => ({
          commander: s,
          subordinates: s.cp.subordinates.ids.map((id) =>
            this.sim.getOrThrow<Ship>(id)
          ),
        }));
      const unassigned = this.query
        .get()
        .filter(
          (s) =>
            s.cp.owner?.id === this.faction.id &&
            !s.cp.commander &&
            s.cp.orders.value.length === 0 &&
            s.cp.model.slug !== "seahorse"
        );
      const flagships = this.query
        .get()
        .filter(
          (s) =>
            s.cp.owner?.id === this.faction.id &&
            !s.cp.commander &&
            s.cp.model.slug === "seahorse"
        );

      this.cooldowns.doEvery("spawnFlagship", 15 * 60, () =>
        spawnFlagship(this.sim, this.faction, flagships)
      );
      this.cooldowns.doEvery("spawnSquad", 3 * 60, () =>
        spawnSquad(this.sim, this.faction, squads, flagships, unassigned)
      );
      this.cooldowns.doEvery("return", 1, () =>
        returnToFlagship(unassigned, flagships)
      );
    });
  };
}
