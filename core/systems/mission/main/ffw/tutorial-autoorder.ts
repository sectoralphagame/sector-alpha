import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { find, first } from "@fxts/core";
import type { Sim } from "@core/sim";
import type { Ship } from "@core/archetypes/ship";
import type { MissionHandler } from "../../types";
import conversation from "../../../../world/data/missions/main/ffw/tutorial-autoorder.yml";

Mustache.escape = (text) => text;

interface MainFfwTutorialAutoorderMission extends Mission {
  minerId: number;
  type: "main.ffw.tutorial-autoorder";
}

export const mainFfwTutorialAutoorderMission = (
  minerId: number,
  common: MissionCommon
): MainFfwTutorialAutoorderMission => ({
  ...common,
  minerId,
  type: "main.ffw.tutorial-autoorder",
});

export const isMainFfwTutorialAutoorderMission = (
  mission: Mission
): mission is MainFfwTutorialAutoorderMission =>
  mission.type === "main.ffw.tutorial-autoorder";

export const mainFfwTutorialAutoorderMissionHandler: MissionHandler = {
  generate: (_sim) => ({
    conversation,
    rewards: [],
    type: "main.ffw.tutorial-autoorder",
    immediate: true,
  }),
  accept: (sim, _offer) => {
    const player = first(sim.index.player.getIt())!;
    const miner = find(
      (s) => s.cp.owner.id === player.id && s.cp.mining,
      sim.index.ships.getIt()
    )!;

    return mainFfwTutorialAutoorderMission(miner.id, {
      accepted: sim.getTime(),
      cancellable: false,
      description:
        "This part of training requires you to set up an auto-order for your miner.",
      references: [{ id: miner!.id, name: miner!.cp.name!.value }],
      rewards: [
        {
          type: "mission",
          mission: "main.ffw.tutorial-escort",
        },
      ],
      title: "Tutorial: Auto-Order",
    });
  },
  isFailed: (mission, sim) => {
    if (!isMainFfwTutorialAutoorderMission(mission))
      throw new Error("Mission is not a main.ffw.tutorial-autoorder mission");

    return !sim.get(mission.minerId);
  },
  isCompleted: (mission: Mission, sim) => {
    if (!isMainFfwTutorialAutoorderMission(mission))
      throw new Error("Mission is not a main.ffw.tutorial-autoorder mission");

    return (
      sim.getOrThrow<Ship>(mission.minerId).cp.autoOrder.default.type === "mine"
    );
  },
  update: (mission: Mission, _sim: Sim) => {
    if (!isMainFfwTutorialAutoorderMission(mission))
      throw new Error("Mission is not a main.ffw.tutorial-autoorder mission");
  },
  formatProgress: (_mission: MainFfwTutorialAutoorderMission) => "",
};
