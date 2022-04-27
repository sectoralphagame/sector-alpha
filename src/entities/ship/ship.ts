import { Matrix } from "mathjs";
import { Order } from "./orders";
import { Sim } from "../../sim";
import { Entity } from "../../components/entity";
import { Owner } from "../../components/owner";
import { CommodityStorage } from "../../components/storage";
import { Position } from "../../components/position";
import { Selection } from "../../components/selection";
import { Render } from "../../components/render";
import { AutoOrder } from "../../components/autoOrder";
import { Name } from "../../components/name";
import { Drive, ShipDriveProps } from "../../components/drive";
import { Mining } from "../../components/mining";
import { Orders } from "../../components/orders";

export interface InitialShipInput {
  name: string;
  position: Matrix;
  drive: ShipDriveProps;
  sim: Sim;
  storage: number;
  mining: number;
}

export class Ship extends Entity {
  orders: Order[];

  constructor(initial: InitialShipInput) {
    super(initial.sim);

    this.addComponent(
      "autoOrder",
      new AutoOrder(initial.mining ? "mine" : "trade")
    );
    this.addComponent("drive", new Drive(initial.drive));
    this.addComponent("mining", new Mining(initial.mining));
    this.addComponent("name", new Name(initial.name));
    this.addComponent("orders", new Orders());
    this.addComponent("owner", new Owner());
    this.addComponent("position", new Position(initial.position));
    this.addComponent("render", new Render(0.5, 0.9));
    this.addComponent("selection", new Selection());
    this.addComponent("storage", new CommodityStorage());

    this.cp.storage.max = initial.storage;

    this.sim.ships.push(this);
  }
}
