import {
  add,
  divide,
  matrix,
  Matrix,
  min,
  multiply,
  norm,
  subtract,
} from "mathjs";
import cloneDeep from "lodash/cloneDeep";
import { Order } from "./orders";
import { Facility, TransactionInput } from "../../economy/factility";
import { CommodityStorage } from "../../economy/storage";
import { MoveOrder, tradeOrder, TradeOrder } from ".";
import { commodities, Commodity } from "../../economy/commodity";
import { sim } from "../../sim";
import { Faction } from "../../economy/faction";
import { Cooldowns } from "../../utils/cooldowns";
import { InsufficientStorage, InsufficientStorageSpace } from "../../errors";
import { getClosestFacility } from "../../economy/utils";

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
  cooldowns: Cooldowns<"retryOrder" | "autoOrder">;
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
    this.position = cloneDeep(initial.position);
    this.cooldowns = new Cooldowns("retryOrder", "autoOrder");
    this.cooldowns.use("autoOrder", 1);

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

  addOrder = (order: Order) => this.orders.push(order);

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
          if (order.offer.type === "sell") {
            this.storage.transfer(
              order.offer.commodity,
              order.offer.quantity,
              order.target.storage,
              true
            );
          } else {
            order.target.storage.transfer(
              order.offer.commodity,
              order.offer.quantity,
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

  autoBuyMostNeededByCommander = (commodity: Commodity): boolean => {
    let target = getClosestFacility(
      this.owner.facilities.filter(
        (facility) =>
          facility.offers[commodity].quantity > 0 &&
          facility.offers[commodity].type === "sell"
      ),
      this.position
    );
    if (!target) {
      target = getClosestFacility(
        sim.factions
          .filter((faction) => faction.slug !== this.owner.slug)
          .map((faction) => faction.facilities)
          .flat()
          .filter(
            (facility) =>
              facility.offers[commodity].quantity > 0 &&
              facility.offers[commodity].type === "sell"
          ),
        this.position
      );
    }

    if (!target) return false;

    const quantity = min(
      this.commander.offers[commodity].quantity,
      this.storage.max,
      target.offers[commodity].quantity,
      this.owner === target.owner
        ? Infinity
        : this.commander.budget.getAvailableMoney() /
            this.commander.offers[commodity].price
    );
    const price =
      this.owner === target.owner ? 0 : target.offers[commodity].price;

    if (quantity === 0) {
      return false;
    }

    const buyerMoneyAllocation =
      this.owner === target.owner
        ? null
        : this.commander.budget.allocations.new({
            amount: quantity * target.offers[commodity].price,
          }).id;

    this.addOrder(
      tradeOrder({
        target,
        offer: {
          price,
          quantity,
          commodity,
          faction: this.owner,
          budget: this.commander.budget,
          allocations: {
            buyer: { budget: buyerMoneyAllocation, storage: null },
            seller: { budget: null, storage: null },
          },
          type: "buy",
        },
      })
    );

    return true;
  };

  autoSellMostRedundantToCommander = (commodity: Commodity) => {
    let target = getClosestFacility(
      this.owner.facilities.filter(
        (facility) =>
          facility.offers[commodity].quantity > 0 &&
          facility.offers[commodity].type === "buy"
      ),
      this.position
    );
    if (!target) {
      target = getClosestFacility(
        sim.factions
          .filter((faction) => faction.slug !== this.owner.slug)
          .map((faction) => faction.facilities)
          .flat()
          .filter(
            (facility) =>
              facility.offers[commodity].quantity > 0 &&
              facility.offers[commodity].type === "buy"
          ),
        this.position
      );
    }

    if (!target) return;

    const quantity = min(
      this.commander.offers[commodity].quantity,
      this.storage.max,
      target.offers[commodity].quantity
    );
    const price =
      this.owner === target.owner ? 0 : target.offers[commodity].price;
    const offer: TransactionInput = {
      price,
      quantity,
      commodity,
      faction: this.owner,
      budget: this.commander.budget,
      allocations: {
        buyer: { budget: null, storage: null },
        seller: { budget: null, storage: null },
      },
      type: "sell",
    };

    const buyerMoneyAllocation = target.allocate(offer);
    if (!buyerMoneyAllocation) return;

    this.addOrder({
      type: "trade",
      target: this.commander,
      offer: {
        ...offer,
        price: 0,
        allocations: {
          buyer: { budget: null, storage: null },
          seller: { budget: null, storage: null },
        },
        type: "buy",
      },
    });
    this.addOrder(
      tradeOrder({
        target,
        offer: {
          ...offer,
          allocations: {
            buyer: { budget: buyerMoneyAllocation.id, storage: null },
            seller: { budget: null, storage: null },
          },
        },
      })
    );
  };

  moveOrder = (delta: number, order: MoveOrder): boolean =>
    this.moveTo(delta, order.position);

  autoOrder = () => {
    if (!(this.commander || this.orders.length !== 0)) {
      return;
    }
    if (this.storage.getAvailableSpace() !== this.storage.max) {
      this.returnToFacility();
    } else {
      const needs = this.commander.getNeededCommodities();
      if (needs.length && this.autoBuyMostNeededByCommander(needs[0])) {
        return;
      }

      const redundant = this.commander.getCommoditiesForSell();
      if (redundant.length) {
        this.autoSellMostRedundantToCommander(redundant[0]);
      }
    }
  };

  returnToFacility = () =>
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
                allocations: {
                  buyer: { budget: null, storage: null },
                  seller: { budget: null, storage: null },
                },
                type: "sell",
              },
              target: this.commander,
            } as TradeOrder)
        )
        .filter((order) => order.offer.quantity > 0)
    );

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
    } else if (this.commander && this.cooldowns.canUse("autoOrder")) {
      this.autoOrder();
      this.cooldowns.use("autoOrder", 3);
    }
    this.cooldowns.update(delta);
  };
}
