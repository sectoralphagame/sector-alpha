import { add, divide, matrix, Matrix, multiply, norm, subtract } from "mathjs";
import cloneDeep from "lodash/cloneDeep";
import { Order } from "./orders";
import { Facility } from "../../economy/factility";
import { CommodityStorage } from "../../economy/storage";
import { MoveOrder, TradeOrder } from ".";
import { commodities } from "../../economy/commodity";
import { sim } from "../../sim";
import { Faction } from "../../economy/faction";
import { isSellOffer } from "../../economy/utils";
import { Cooldowns } from "../../utils/cooldowns";
import { InsufficientStorage, InsufficientStorageSpace } from "../../errors";

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
  cooldowns: Cooldowns<"retryOrder">;
  retryOrderCounter: number = 0;

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
    this.cooldowns = new Cooldowns("retryOrder");

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
    const targetReached = this.moveTo(delta, order.target.position);
    if (targetReached) {
      if (order.target.isTradeAccepted(order.offer)) {
        try {
          if (isSellOffer(order.offer)) {
            this.storage.transfer(
              order.offer.commodity,
              order.offer.quantity,
              order.target.storage,
              true
            );
          } else {
            order.target.storage.transfer(
              order.offer.commodity,
              -order.offer.quantity,
              this.storage,
              true
            );
          }

          order.target.acceptTrade(order.offer);
          return true;
        } catch (err) {
          if (
            !(
              err instanceof InsufficientStorageSpace ||
              err instanceof InsufficientStorage
            )
          ) {
            throw err;
          }
        }
      }

      if (this.retryOrderCounter < 5) {
        this.retryOrderCounter += 1;
        this.cooldowns.use("retryOrder", 5);
      } else {
        this.retryOrderCounter = 0;
        return true;
      }
    }

    return false;
  };

  moveOrder = (delta: number, order: MoveOrder): boolean =>
    this.moveTo(delta, order.position);

  sim = (delta: number) => {
    if (this.orders.length) {
      if (this.cooldowns.canUse("retryOrder")) {
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

        const completed = orderFn(delta, this.orders[0]);
        if (completed) {
          this.orders = this.orders.slice(1);
        }
      }
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
                    faction: this.commander.owner,
                    price: 0,
                    quantity: this.storage.getAvailableWares()[commodity],
                    budget: this.commander?.budget ?? this.owner.budget,
                  },
                  target: this.commander,
                } as TradeOrder)
            )
            .filter((order) => order.offer.quantity > 0)
        );
        this.idle = true;
      }
    }
    this.cooldowns.update(delta);
  };
}
