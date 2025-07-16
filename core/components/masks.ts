/* eslint-disable no-bitwise */
import type { CoreComponents } from "./component";

// DO NOT CHANGE THE ORDER OF THIS LIST, EVER
export const componentList = [
  "ai",
  "mineable",
  "autoOrder",
  "blueprints",
  "budget",
  "builder",
  "camera",
  "children",
  "color",
  "commander",
  "compoundProduction",
  "creationDate",
  "damage",
  "deployable",
  "disposable",
  "dockable",
  "docks",
  "drive",
  "facilityModuleQueue",
  "hecsPosition",
  "hitpoints",
  "inflationStats",
  "journal",
  "minable", // @deprecated
  "mining",
  "missions",
  "model",
  "orders",
  "relations",
  "renderGraphics", // @deprecated
  "sectorStats",
  "shipyard",
  "subordinates",
  "systemManager",
  "teleport",
  "trade",
  "modules",
  "name",
  "owner",
  "parent",
  "production",
  "position",
  "render",
  "selectionManager",
  "simpleCommodityStorage",
  "storage",
  "facilityModuleBonus",
  "crew",
  "crewRequirement",
  "movable",
  "storageTransfer",
  "policies",
  "experience",
  "modifiers",
];
export const componentMask: Record<keyof CoreComponents, bigint> =
  componentList.reduce(
    (acc, component, index) => ({
      ...acc,
      [component]: BigInt(1) << BigInt(index),
    }),
    {} as Record<keyof CoreComponents, bigint>
  );
