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
import merge from "lodash/merge";
import { Order } from "./orders";
import { Facility } from "../../economy/factility";
import { CommodityStorage } from "../../economy/storage";
import { MoveOrder, tradeOrder, TradeOrder } from ".";
import { commodities, Commodity } from "../../economy/commodity";
import { sim } from "../../sim";
import { Faction } from "../../economy/faction";
import { Cooldowns } from "../../utils/cooldowns";
import { getAnyClosestFacility } from "../../economy/utils";

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
      if (order.offer.type === "sell") {
        order.target.storage.allocationManager.release(
          order.offer.allocations.buyer.storage
        );

        this.storage.transfer(
          order.offer.commodity,
          order.offer.quantity,
          order.target.storage,
          true
        );
      } else {
        order.target.storage.allocationManager.release(
          order.offer.allocations.seller.storage
        );
        order.target.storage.transfer(
          order.offer.commodity,
          order.offer.quantity,
          this.storage,
          true
        );
      }

      order.target.acceptTrade(order.offer);
      return true;
    }

    return false;
  };

  autoBuyMostNeededByCommander = (commodity: Commodity): boolean => {
    const target = getAnyClosestFacility(
      this.commander,
      (facility) =>
        facility.offers[commodity].quantity > 0 &&
        facility.offers[commodity].type === "sell"
    );

    if (!target) return false;

    return this.tradeCommodity(commodity, this.commander, target);
  };

  autoSellMostRedundantToCommander = (commodity: Commodity): boolean => {
    const target = getAnyClosestFacility(
      this.commander,
      (facility) =>
        facility.offers[commodity].quantity > 0 &&
        facility.offers[commodity].type === "buy"
    );

    if (!target) return false;

    return this.tradeCommodity(commodity, target, this.commander);
  };

  tradeCommodity = (
    commodity: Commodity,
    buyer: Facility,
    seller: Facility
  ): boolean => {
    const sameFaction = this.owner === seller.owner;
    const buy = this.commander === buyer;

    const quantity = min(
      buyer.offers[commodity].quantity,
      this.storage.max,
      seller.offers[commodity].quantity,
      sameFaction
        ? Infinity
        : this.commander.budget.getAvailableMoney() /
            this.commander.offers[commodity].price
    );

    if (quantity === 0) {
      return false;
    }

    const price = sameFaction ? 0 : seller.offers[commodity].price;

    const offer = {
      price,
      quantity,
      commodity,
      faction: this.owner,
      budget: this.commander.budget,
      allocations: null,
      type: "buy" as "buy",
    };

    const buyerAllocations = buyer.allocate({
      ...offer,
      type: "sell",
    });
    if (!buyerAllocations) return false;

    const sellerAllocations = seller.allocate(offer);
    if (!sellerAllocations) return false;

    this.addOrder(
      tradeOrder({
        target: seller,
        offer: {
          ...offer,
          price: buy ? price : 0,
          allocations: {
            buyer: {
              budget: buyerAllocations.budget?.id,
              storage: null,
            },
            seller: { budget: null, storage: sellerAllocations.storage.id },
          },
          type: "buy",
        },
      })
    );

    this.addOrder(
      tradeOrder({
        target: buyer,
        offer: {
          ...offer,
          price: buy ? 0 : price,
          allocations: {
            buyer: {
              budget: buyerAllocations.budget?.id,
              storage: buyerAllocations.storage.id,
            },
            seller: { budget: null, storage: null },
          },
          type: "sell",
        },
      })
    );

    return true;
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
                allocations: null,
                type: "sell",
              },
              target: this.commander,
            } as TradeOrder)
        )
        .filter((order) => order.offer.quantity > 0)
        .map((order) => {
          const allocations = this.commander.allocate(order.offer);
          if (allocations) {
            return merge(order, {
              offer: {
                allocations: {
                  buyer: {
                    storage: allocations.storage.id,
                  },
                },
              },
            });
          }

          return null;
        })
        .filter(Boolean)
    );

  holdPosition = () => false;

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
