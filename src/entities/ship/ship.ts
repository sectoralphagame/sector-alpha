import { add, divide, matrix, Matrix, multiply, norm, subtract } from "mathjs";
import cloneDeep from "lodash/cloneDeep";
import { Order } from "./orders";
import { Facility, offerToStr } from "../../economy/factility";
import { CommodityStorage } from "../../economy/storage";
import { MoveOrder, TradeOrder } from ".";
import { commodities } from "../../economy/commodity";
import { sim } from "../../sim";
import { Faction } from "../../economy/faction";

let shipIdCounter = 0;

export interface InitialShipInput {
  name: string;
  position: Matrix;
  speed: number;
  storage: number;
}

export class Ship {
  id: number;
  name: string;
  speed: number;
  position: Matrix;
  storage: CommodityStorage;
  owner: Faction;
  commander: Facility | null;
  orders: Order[];
  idle: boolean;

  constructor(initial: InitialShipInput) {
    this.id = shipIdCounter;
    shipIdCounter += 1;

    this.name = initial.name;
    this.speed = initial.speed;
    this.storage = new CommodityStorage();
    this.storage.max = initial.storage;
    this.owner = null;
    this.commander = null;
    this.orders = [];
    this.idle = true;
    this.position = cloneDeep(initial.position);
    sim.ships.push(this);
  }

  setOwner = (owner: Faction) => {
    this.owner = owner;
  };
  clearOwner = () => {
    this.owner = null;
  };

  setCommander = (commander: Facility) => {
    this.commander = commander;
  };
  clearCommander = () => {
    this.commander = null;
  };

  addOrder = (order: Order) => {
    this.orders.push(order);
    this.idle = false;
    // console.log("Dispatching ship", this, order);
  };

  moveTo = (delta: number, position: Matrix): boolean => {
    const path = subtract(position, this.position) as Matrix;
    const dPos =
      norm(path) > 0
        ? (multiply(divide(path, norm(path)), this.speed * delta) as Matrix)
        : matrix([0, 0]);

    if (norm(dPos) >= norm(path)) {
      this.position = cloneDeep(position);
      return true;
    }

    this.position = add(this.position, dPos) as Matrix;
    return false;
  };

  tradeOrder = (delta: number, order: TradeOrder): boolean => {
    let done = false;
    const targetReached = this.moveTo(delta, order.target.position);
    if (targetReached) {
      if (order.target.isTradeAccepted(order.offer)) {
        order.target.acceptTrade(order.offer);
        this.storage.removeStorage(
          order.offer.commodity,
          order.offer.quantity -
            order.target.storage.addStorage(
              order.offer.commodity,
              order.offer.quantity
            )
        );
        if (this.commander) {
          this.commander.changeMoney(order.offer.quantity * order.offer.price);
        }

        // console.log(
        //   `Trade accepted: ${offerToStr(order.offer.commodity, order.offer)}`
        // );
      } else {
        // console.log(
        //   `Trade not accepted, ours: ${offerToStr(
        //     order.offer.commodity,
        //     order.offer
        //   )}, theirs: ${offerToStr(
        //     order.offer.commodity,
        //     order.target.offers[order.offer.commodity]
        //   )}`
        // );
      }

      done = true;
      this.orders = this.orders.slice(1);
    }
    return done;
  };

  moveOrder = (delta: number, order: MoveOrder): boolean => {
    const targetReached = this.moveTo(delta, order.position);
    if (targetReached) {
      this.orders = this.orders.slice(1);
    }

    return targetReached;
  };

  sim = (delta: number) => {
    if (this.orders.length) {
      // eslint-disable-next-line no-unused-vars, no-shadow
      let orderFn: (delta: number, order: Order) => boolean;

      switch (this.orders[0].type) {
        case "trade":
          orderFn = this.tradeOrder;
          break;
        case "move":
          orderFn = this.moveOrder;
          break;
        default:
          orderFn = () => undefined;
      }

      orderFn(delta, this.orders[0]);
    } else if (this.commander) {
      if (!this.idle) {
        this.orders.push(
          ...Object.values(commodities)
            .map(
              (commodity) =>
                ({
                  type: "trade",
                  offer: {
                    commodity,
                    faction: this.commander.faction,
                    price: 0,
                    quantity: this.storage.stored[commodity],
                  },
                  target: this.commander,
                } as TradeOrder)
            )
            .filter((order) => order.offer.quantity > 0)
        );
        this.idle = true;
      }
    }
  };
}
