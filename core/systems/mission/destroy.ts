import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { relationThresholds } from "@core/components/relations";
import { pickRandom } from "@core/utils/generators";
import { add, random, randomInt } from "mathjs";
import { first, map, pipe, repeat, toArray } from "@fxts/core";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { hecsToCartesian } from "@core/components/hecsPosition";
import { addSubordinate } from "@core/components/subordinates";
import { sectorSize } from "@core/archetypes/sector";
import type { Position2D } from "@core/components/position";
import missions from "../../world/data/missions.json";
import type { MissionHandler } from "./types";

Mustache.escape = (text) => text;

interface DestroyMission extends Mission {
  type: "destroy";
  entities: number[];
  faction: number;
}

export const destroyMission = (
  entityIds: number[],
  faction: number,
  common: MissionCommon
): DestroyMission => ({
  ...common,
  entities: entityIds,
  type: "destroy",
  faction,
});

const isDestroyMission = (mission: Mission): mission is DestroyMission =>
  mission.type === "destroy";

export const destroyMissionHandler: MissionHandler = {
  generate: (sim) => {
    const player = first(sim.queries.player.getIt())!;
    const faction = pickRandom(
      sim.queries.ai
        .get()
        .filter(
          (f) => player.cp.relations.values[f.id] >= relationThresholds.mission
        )
    );
    if (!faction) return null;

    const sector = pickRandom(
      sim.queries.sectors
        .get()
        .filter(
          (s) =>
            s.cp.owner?.id === faction.id &&
            !player.cp.missions.value.some(
              (mission) => mission.sectorId === s.id
            )
        )
    );
    const variant = pickRandom(["Pirates"] as const);

    const withFacility = Math.random() > 0.75;

    const pirateFaction = sim.queries.ai
      .get()
      .find((f) => f.cp.name.slug === "PIR")!;
    const shipClass = shipClasses.find((s) => s.slug === "roach")!;
    const spawnPoint = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );
    const entities = pipe(
      repeat(randomInt(2, 4), () =>
        createShip(sim, {
          ...shipClass,
          owner: pirateFaction,
          position: add(spawnPoint, [
            randomInt(-0.3, 0.3),
            randomInt(-0.3, 0.3),
          ]) as Position2D,
          sector,
        })
      ),
      map((cb) => cb()),
      toArray
    );

    entities[0].cp.autoOrder.default = {
      type: "pillage",
      sectorId: sector.id,
      clockwise: Math.random() > 0.5,
    };
    entities.slice(1).forEach((entity) => {
      addSubordinate(entities[0], entity);
      entity.cp.autoOrder.default = {
        type: "escort",
        targetId: entities[0].id,
      };
    });

    const reward =
      (entities.length * randomInt(25, 35) +
        (withFacility ? randomInt(800, 1200) : 0)) *
      1000;

    const template = pickRandom(
      missions[`destroy${variant}`].filter(
        (mission) => withFacility === (mission.variant === "facilityRaid")
      )
    );
    const transform = (text: string) =>
      Mustache.render(text, {
        faction: faction.cp.name.value,
        sector: sector.cp.name.value,
        reward,
      });

    return {
      title: transform(template.title),
      prompt: transform(template.prompt),
      actorName: "Local Police",
      responses: template.responses.map((r) => ({
        next: transform(r.next),
        text: transform(r.text),
        actor: "player",
        type: r.type as "accept" | "decline" | "neutral",
      })),
      data: destroyMission(
        entities.map((e) => e.id),
        faction.id,
        {
          accepted: sim.getTime(),
          title: transform(template.title),
          description: transform(template.description),
          rewards: [
            { type: "money", amount: reward },
            { type: "relation", amount: random(1, 2), factionId: faction.id },
          ],
        }
      ),
    };
  },
  isFailed: () => false,
  isCompleted: (mission: Mission, sim) => {
    if (!isDestroyMission(mission))
      throw new Error("Mission is not a destroy mission");

    return mission.entities.every((id) => !sim.get(id));
  },
  update: () => {},
};
