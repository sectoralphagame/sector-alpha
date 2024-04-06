---
to: core/systems/mission/<%= name.split(".").join("/") %>.ts
---

import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { first } from "@fxts/core";
import type { Sim } from "@core/sim";
import type { MissionHandler } from "../../types";
import conversation from "../../../../world/data/missions/<%= name.split(".").join("/") %>.m.yml";

Mustache.escape = (text) => text;

interface <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), false) %>Mission extends Mission {
  type: "<%= name %>";
}

export const <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), true) %>Mission = (
  minerId: number,
  common: MissionCommon
): <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission => ({
  ...common,
  minerId,
  type: "<%= name %>",
});

export const is<%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission = (
  mission: Mission
): mission is <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission =>
  mission.type === "<%= name %>";

export const <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), true) %>MissionHandler: MissionHandler = {
  generate: (_sim) => ({
    conversation,
    rewards: [],
    type: "<%= name %>",
  }),
  accept: (sim, offer) => {
    const player = first(sim.queries.player.getIt())!;

    return <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), true) %>Mission(miner.id, {
      accepted: sim.getTime(),
    });
  },
  isFailed: (mission, sim) => {
    if (!is<%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission(mission))
      throw new Error("Mission is not a <%= name %> mission");
  },
  isCompleted: (mission: Mission, sim) => {
    if (!is<%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission(mission))
      throw new Error("Mission is not a <%= name %> mission");
  },
  update: (mission: Mission, _sim: Sim) => {
    if (!is<%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission(mission))
      throw new Error("Mission is not a <%= name %> mission");
  },
  formatProgress: (mission: <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_")) %>Mission) => "",
};
