import { Matrix } from "mathjs";
import Color from "color";
import { AutoOrder } from "../components/autoOrder";
import { Drive, ShipDriveProps } from "../components/drive";
import { Entity } from "../components/entity";
import { Mining } from "../components/mining";
import { Name } from "../components/name";
import { Orders } from "../components/orders";
import { Owner } from "../components/owner";
import { Position } from "../components/position";
import { Render } from "../components/render";
import { Selection } from "../components/selection";
import { CommodityStorage } from "../components/storage";
import { Faction } from "../economy/faction";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import sCivTexture from "../../assets/s_civ.svg";

export const shipComponents = [
  "drive",
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
  if (!entity.hasComponents(shipComponents)) {
    throw new MissingComponentError(entity, shipComponents);
  }

  return entity as Ship;
}

export interface InitialShipInput {
  name: string;
  position: Matrix;
  drive: ShipDriveProps;
  owner: Faction;
  storage: number;
  mining: number;
}

export function createShip(sim: Sim, initial: InitialShipInput) {
  const entity = new Entity(sim);

  entity.addComponent(
    "autoOrder",
    new AutoOrder(initial.mining ? "mine" : "trade")
  );
  entity.addComponent("drive", new Drive(initial.drive));
  entity.addComponent("name", new Name(initial.name));
  entity.addComponent("orders", new Orders());
  entity.addComponent("owner", new Owner(initial.owner));
  entity.addComponent("position", new Position(initial.position));
  entity.addComponent(
    "render",
    new Render({
      color: Color(initial.owner.color).rgbNumber(),
      defaultScale: 0.4,
      maxZ: 0.9,
      pathToTexture: sCivTexture,
      zIndex: 2,
    })
  );
  entity.addComponent("selection", new Selection());
  entity.addComponent("storage", new CommodityStorage());

  if (initial.mining) {
    entity.addComponent("mining", new Mining(initial.mining));
  }

  entity.cp.storage.max = initial.storage;

  return entity as Ship;
}
