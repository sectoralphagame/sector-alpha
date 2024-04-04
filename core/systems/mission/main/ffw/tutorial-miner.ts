import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { add, random } from "mathjs";
import { find, first } from "@fxts/core";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { hecsToCartesian } from "@core/components/hecsPosition";
import { sectorSize } from "@core/archetypes/sector";
import type { Position2D } from "@core/components/position";
import type { Sim } from "@core/sim";
import type { MissionHandler } from "../../types";
import conversation from "../../../../world/data/missions/main/ffw/tutorial-miner.m.yml";

Mustache.escape = (text) => text;

interface MainFfwTutorialMinerMission extends Mission {
  minerId: number;
  type: "main.ffw.tutorial.miner";
}

export const mainFfwTutorialMinerMission = (
  minerId: number,
  common: MissionCommon
): MainFfwTutorialMinerMission => ({
  ...common,
  minerId,
  type: "main.ffw.tutorial.miner",
});

const isMainFfwTutorialMinerMission = (
  mission: Mission
): mission is MainFfwTutorialMinerMission =>
  mission.type === "main.ffw.tutorial.miner";

export const mainFfwTutorialMinerMissionHandler: MissionHandler = {
  generate: (sim) => {
    const player = first(sim.queries.player.getIt())!;
    const gaia = find(
      (sector) => sector.cp.name.value === "Gaia",
      sim.queries.sectors.getIt()
    )!;
    const miner = createShip(sim, {
      ...shipClasses.find(({ slug }) => slug === "smallMinerA")!,
      angle: random(-Math.PI, Math.PI),
      position: add(
        hecsToCartesian(gaia.cp.hecsPosition.value, sectorSize / 10),
        [random(-1, 1), random(-1, 1)]
      ) as Position2D,
      owner: player,
      sector: gaia,
    });
    miner.cp.autoOrder!.default = { type: "hold" };
    const mission = missions["main.ffw.tutorial.miner"][0];

    return {
      title: "Tutorial: Mining",
      prompt:
        "Admiral Russo has requested that you mine some resources as a part of your training.",
      actorName: mission.actorName,
      responses: mission.responses.map((r) => ({
        next: r.next,
        text: r.text,
        actor: "player",
        type: r.type as "accept" | "decline" | "neutral",
      })),
      data: mainFfwTutorialMinerMission(miner.id, {
        accepted: sim.getTime(),
        title: mission.title,
        description: mission.description,
        rewards: [],
        references: [{ id: miner.id, name: miner.cp.name.value }],
        progress: {
          current: 0,
          max: 1,
        },
      }),
    };
  },
  isFailed: (mission, sim) => {
    if (!isMainFfwTutorialMinerMission(mission))
      throw new Error("Mission is not a mainFfwTutorialMiner mission");

    return !sim.get(mission.minerId);
  },
  isCompleted: (mission: Mission, sim) => {
    if (!isMainFfwTutorialMinerMission(mission))
      throw new Error("Mission is not a mainFfwTutorialMiner mission");

    const miner = sim.get(mission.minerId);
    return !!miner?.cp.mining!.entityId;
  },
  update: (mission: Mission, _sim: Sim) => {
    if (!isMainFfwTutorialMinerMission(mission))
      throw new Error("Mission is not a mainFfwTutorialMiner mission");
  },
  formatProgress: (mission: MainFfwTutorialMinerMission) =>
    `${mission.progress.current} / ${mission.progress.max} miners working`,
};
