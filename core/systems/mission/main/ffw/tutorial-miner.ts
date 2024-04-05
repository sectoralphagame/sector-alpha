import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { random } from "mathjs";
import { find, first } from "@fxts/core";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import type { Sim } from "@core/sim";
import type { MissionHandler } from "../../types";
import conversation from "../../../../world/data/missions/main/ffw/tutorial-miner.m.yml";

Mustache.escape = (text) => text;

interface MainFfwTutorialMinerMission extends Mission {
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

export const isMainFfwTutorialMinerMission = (
  mission: Mission
): mission is MainFfwTutorialMinerMission =>
  mission.type === "main.ffw.tutorial.miner";

export const mainFfwTutorialMinerMissionHandler: MissionHandler = {
  generate: (_sim) => ({
    conversation,
    rewards: [],
    type: "main.ffw.tutorial.miner",
  }),
  accept: (sim, offer) => {
    const player = first(sim.queries.player.getIt())!;
    player.tags.add("mainQuestStarted");
    const sector = find(
      (s) => s.cp.name.value === "Teegarden's Star II",
      sim.queries.sectors.get()
    )!;

    const miner = createShip(sim, {
      ...shipClasses.find(({ slug }) => slug === "smallMinerA")!,
      angle: random(-Math.PI, Math.PI),
      position: [random(-1, 1), random(-1, 1)],
      owner: player,
      sector,
    });
    miner.cp.autoOrder!.default = { type: "hold" };

    return mainFfwTutorialMinerMission(miner.id, {
      accepted: sim.getTime(),
      title: "Tutorial: Mining",
      description:
        "Admiral Russo has requested that you mine some resources as a part of your training.",
      rewards: offer.rewards,
      references: [{ id: miner.id, name: miner.cp.name.value }],
      progress: {
        current: 0,
        max: 1,
      },
      cancellable: false,
    });
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
