import { Matrix } from "mathjs";
import Color from "color";
import pick from "lodash/pick";
import { createDrive } from "../components/drive";
import { Entity } from "../components/entity";
import { createMining } from "../components/mining";
import { createRender } from "../components/render";
import { createCommodityStorage } from "../components/storage";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";
import { Faction } from "./faction";
import { ShipInput } from "../world/ships";

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
      default: initial.mining ? "mine" : "trade",
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
        maxZ: 0.1,
        texture: initial.texture,
        zIndex: 2,
      })
    )
    .addComponent({ name: "selection" })
    .addComponent(createCommodityStorage())
    .addComponent({
      name: "dockable",
      size: "small",
      dockedIn: null,
    })
    .addComponent({ name: "journal", entries: [] });

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
