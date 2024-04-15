---
to: core/systems/mission/<%= name.split(".").join("/") %>.ts
---

import type { Mission } from "@core/components/missions";
import { first } from "@fxts/core";
import type { Sim } from "@core/sim";
import type { MissionHandler } from "<%= new Array(name.split(".").length - 1).fill("..").join("/") %>/types";
import conversation from "<%= new Array(name.split(".").length + 1).fill("..").join("/") %>/world/data/missions/<%= name.split(".").join("/") %>.yml";

interface <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), false) %>MissionData {
  
}

interface <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), false) %>Mission extends Mission {
  data: <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), false) %>MissionData;
  type: "<%= name %>";
}

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
  accept: (sim, offer): <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), false) %>Mission => {
    const player = first(sim.queries.player.getIt())!;
    const data = offer.data as <%= h.inflection.camelize(name.replace(/\./g, "_").replace(/-/g, "_"), false) %>MissionData;

    return {
      data,
      accepted: sim.getTime(),
      type: "<%= name %>",
    };
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
