import { Matrix } from "mathjs";
import Color from "color";
import { createDrive, ShipDriveProps } from "../components/drive";
import { Entity } from "../components/entity";
import { createMining } from "../components/mining";
import { Render } from "../components/render";
import { createCommodityStorage } from "../components/storage";
import { Faction } from "../economy/faction";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";

export const shipComponents = [
  "drive",
  "dockable",
  "name",
  "orders",
  "owner",
  "position",
  "render",
  "storage",
] as const;

// Ugly hack to transform shipComponents array type to string union
const widenType = [...shipComponents][0];
export type ShipComponent = typeof widenType;
export type Ship = RequireComponent<ShipComponent>;

export function ship(entity: Entity): Ship {
  return entity.requireComponents(shipComponents);
}

export interface InitialShipInput {
  name: string;
  position: Matrix;
  drive: ShipDriveProps;
  owner: Faction;
  storage: number;
  mining: number;
  texture: string;
  sector: Sector;
}

export function createShip(sim: Sim, initial: InitialShipInput): Ship {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "autoOrder",
      default: initial.mining ? "mine" : "trade",
    })
    .addComponent(createDrive(initial.drive))
    .addComponent({ name: "name", value: initial.name })
    .addComponent({
      name: "orders",
      value: [],
    })
    .addComponent({ name: "owner", value: initial.owner })
    .addComponent({
      name: "position",
      angle: 0,
      coord: initial.position,
      entity: initial.sector,
      entityId: initial.sector.id,
    })
    .addComponent(
      new Render({
        color: Color(initial.owner.color).rgbNumber(),
        defaultScale: 0.4,
        maxZ: 0.5,
        pathToTexture: initial.texture,
        zIndex: 2,
      })
    )
    .addComponent({ name: "selection" })
    .addComponent(createCommodityStorage())
    .addComponent({
      name: "dockable",
      size: "small",
      entity: null,
      entityId: null,
    });

  if (initial.mining) {
    entity.addComponent(createMining(initial.mining));
  }

  const shipEntity = ship(entity);
  shipEntity.cp.storage!.max = initial.storage;

  return shipEntity;
}
