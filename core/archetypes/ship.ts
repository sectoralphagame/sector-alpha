import type { Matrix } from "mathjs";
import Color from "color";
import pick from "lodash/pick";
import { createDrive } from "../components/drive";
import { Entity } from "../entity";
import { createMining } from "../components/mining";
import { createRender } from "../components/render";
import { createCommodityStorage } from "../components/storage";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import type { Sector } from "./sector";
import type { Faction } from "./faction";
import type { ShipInput } from "../world/ships";

export const shipComponents = [
  "autoOrder",
  "drive",
  "dockable",
  "name",
  "orders",
  "owner",
  "position",
  "render",
  "storage",
  "journal",
] as const;

export type ShipComponent = (typeof shipComponents)[number];
export type Ship = RequireComponent<ShipComponent>;

export function ship(entity: Entity): Ship {
  return entity.requireComponents(shipComponents);
}

export interface InitialShipInput extends ShipInput {
  position: Matrix;
  owner: Faction;
  sector: Sector;
}

export function createShip(sim: Sim, initial: InitialShipInput): Ship {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "autoOrder",
      default:
        initial.role === "mining"
          ? { type: "mine", sectorId: initial.sector.id }
          : initial.role === "transport"
          ? { type: "trade", sectorId: initial.sector.id }
          : { type: "hold" },
    })
    .addComponent(
      createDrive(
        pick(initial, ["acceleration", "rotary", "cruise", "ttc", "maneuver"])
      )
    )
    .addComponent({ name: "name", value: initial.name })
    .addComponent({
      name: "orders",
      value: [],
    })
    .addComponent({ name: "owner", id: initial.owner.id })
    .addComponent({
      name: "position",
      angle: 0,
      coord: initial.position,
      sector: initial.sector.id,
      moved: false,
    })
    .addComponent(
      createRender({
        color: Color(initial.owner.cp.color.value).rgbNumber(),
        defaultScale: 0.4,
        texture: initial.texture,
        layer: "ship",
      })
    )
    .addComponent(createCommodityStorage())
    .addComponent({
      name: "dockable",
      size: initial.size,
      dockedIn: null,
    })
    .addComponent({ name: "journal", entries: [] })
    .addComponent({
      name: "hitpoints",
      g: { hp: null!, shield: null! },
      hp: {
        max: initial.hitpoints.hp.value,
        regen: initial.hitpoints.hp.regen,
        value: initial.hitpoints.hp.value,
      },
      shield: {
        max: initial.hitpoints.shield.value,
        regen: initial.hitpoints.shield.regen,
        value: initial.hitpoints.shield.value,
      },
    })
    .addComponent({
      ...initial.damage,
      name: "damage",
      targetId: null,
    })
    .addTag("selection")
    .addTag("ship")
    .addTag(`role:${initial.role}`);

  if (initial.mining) {
    entity.addComponent(createMining(initial.mining));
  }

  if (initial.role === "building") {
    entity.addComponent({
      active: false,
      name: "deployable",
      type: "facility",
      cancel: false,
    });
  }

  if (initial.role === "storage") {
    entity.addComponent({
      active: false,
      name: "deployable",
      type: "builder",
      cancel: false,
    });
  }

  const shipEntity = ship(entity);
  shipEntity.cp.storage!.max = initial.storage;

  return shipEntity;
}
