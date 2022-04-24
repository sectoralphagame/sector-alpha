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
import merge from "lodash/merge";
import { MineOrder, MoveOrder, tradeOrder, TradeOrder, Order } from "./orders";
import { commodities, Commodity } from "../../economy/commodity";
import { Sim } from "../../sim";
import { Cooldowns } from "../../utils/cooldowns";
import {
  getFacilityWithMostProfit,
  getClosestMineableAsteroid,
} from "../../economy/utils";
import { ShipDrive, ShipDriveProps } from "./drive";
import { Entity } from "../../components/entity";
import { Owner } from "../../components/owner";
import { CommodityStorage } from "../../components/storage";
import { Position } from "../../components/position";
import { TransactionInput } from "../../components/trade";
import { acceptTrade, allocate } from "../../utils/trading";
import { Selection } from "../../components/selection";
import { facility, Facility } from "../../archetypes/facility";
import { Render } from "../../components/render";
import { AutoOrder } from "../../components/autoOrder";
import { Name } from "../../components/name";

export interface InitialShipInput {
  name: string;
  position: Matrix;
  drive: ShipDriveProps;
  sim: Sim;
  storage: number;
  mining: number;
}

export class Ship extends Entity {
  drive: ShipDrive;
  orders: Order[];
  cooldowns: Cooldowns<"retryOrder" | "autoOrder" | "mine" | "cruise">;
  mining: number;
  mined: number;
  retryOrderCounter: number = 0;

  constructor(initial: InitialShipInput) {
    super(initial.sim);

    this.drive = new ShipDrive(initial.drive);

    this.orders = [];
    this.cooldowns = new Cooldowns("retryOrder", "autoOrder", "mine", "cruise");
    this.mining = initial.mining;
    this.mined = 0;

    this.cp.autoOrder = new AutoOrder(initial.mining ? "mine" : "trade");
    this.cp.name = new Name(initial.name);
    this.cp.owner = new Owner();
    this.cp.position = new Position(initial.position);
    this.cp.render = new Render(0.5, 0.9);
    this.cp.selection = new Selection();
    this.cp.storage = new CommodityStorage();
    this.cp.storage.max = initial.storage;

    this.sim.ships.push(this);
  }

  addOrder = (order: Order) => this.orders.push(order);

  moveTo = (delta: number, position: Matrix): boolean => {
    const path = subtract(position, this.cp.position.value) as Matrix;
    const speed =
      this.drive.state === "cruise" ? this.drive.cruise : this.drive.maneuver;
    const distance = norm(path);
    const canCruise =
      distance >
      (this.drive.state === "cruise" ? 3 : this.drive.ttc) *
        this.drive.maneuver;

    const dPos =
      norm(path) > 0
        ? (multiply(divide(path, norm(path)), speed * delta) as Matrix)
        : matrix([0, 0]);

    if (norm(dPos) >= distance) {
      this.cp.position.value = matrix(position);
      return true;
    }

    if (canCruise && this.drive.state === "maneuver") {
      this.drive.startCruise();
    }

    if (!canCruise && this.drive.state === "cruise") {
      this.drive.stopCruise();
    }

    this.cp.position.value = add(this.cp.position.value, dPos) as Matrix;
    return false;
  };

  tradeOrder = (delta: number, order: TradeOrder): boolean => {
    const targetReached = this.moveTo(delta, order.target.cp.position.value);
    if (targetReached) {
      if (order.offer.type === "sell") {
        order.target.cp.storage.allocationManager.release(
          order.offer.allocations.buyer.storage
        );

        this.cp.storage.transfer(
          order.offer.commodity,
          order.offer.quantity,
          order.target.cp.storage,
          true
        );
      } else {
        order.target.cp.storage.allocationManager.release(
          order.offer.allocations.seller.storage
        );
        order.target.cp.storage.transfer(
          order.offer.commodity,
          order.offer.quantity,
          this.cp.storage,
          true
        );
      }

      acceptTrade(order.target, order.offer);
      return true;
    }

    return false;
  };

  autoBuyMostNeededByCommander = (commodity: Commodity): boolean => {
    const commander = facility(this.cp.commander.value);

    const target = getFacilityWithMostProfit(commander, commodity);

    if (!target) return false;

    return this.tradeCommodity(commodity, commander, target);
  };

  autoSellMostRedundantToCommander = (commodity: Commodity): boolean => {
    const commander = facility(this.cp.commander.value);

    const target = getFacilityWithMostProfit(commander, commodity);

    if (!target) return false;

    return this.tradeCommodity(commodity, target, commander);
  };

  tradeCommodity = (
    commodity: Commodity,
    buyer: Facility,
    seller: Facility
  ): boolean => {
    const sameFaction = this.cp.owner.value === seller.components.owner.value;
    const buy = this.cp.commander.value === buyer;

    const quantity = Math.floor(
      min(
        buyer.components.trade.offers[commodity].quantity,
        this.cp.storage.max,
        seller.components.trade.offers[commodity].quantity,
        sameFaction
          ? Infinity
          : this.cp.commander.value.components.budget.getAvailableMoney() /
              this.cp.commander.value.components.trade.offers[commodity].price
      )
    );

    if (quantity === 0) {
      return false;
    }

    const price = sameFaction
      ? 0
      : seller.components.trade.offers[commodity].price;

    const offer = {
      price,
      quantity,
      commodity,
      faction: this.cp.owner.value,
      budget: this.cp.commander.value.components.budget,
      allocations: null,
      type: "buy" as "buy",
    };

    const buyerAllocations = allocate(buyer, {
      ...offer,
      type: "sell",
    });
    if (!buyerAllocations) return false;

    const sellerAllocations = allocate(seller, offer);
    if (!sellerAllocations) {
      buyer.components.budget.allocations.release(buyerAllocations.budget.id);
      buyer.cp.storage.allocationManager.release(buyerAllocations.storage.id);
      return false;
    }

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

  mineOrder = (delta: number, order: MineOrder): boolean => {
    if (order.targetRock?.mined !== this.id) {
      order.targetRock = getClosestMineableAsteroid(
        order.target,
        this.cp.position.value
      );
      if (!order.targetRock) return false;
    }
    const rockReached = this.moveTo(delta, order.targetRock.position);

    if (rockReached) {
      if (this.cooldowns.canUse("mine")) {
        this.cooldowns.use("mine", 5);
        this.cp.storage.addStorage(
          order.target.type,
          Math.floor(this.mined),
          false
        );
        this.mined = 0;
      }
      order.targetRock.mined = this.id;
      this.mined += this.mining * delta;

      if (this.cp.storage.getAvailableSpace() === 0) {
        order.targetRock.mined = null;
        return true;
      }
    }

    return false;
  };

  moveOrder = (delta: number, order: MoveOrder): boolean =>
    this.moveTo(delta, order.position);

  sellToCommander = (commodity: Commodity) => {
    const commander = facility(this.cp.commander.value);

    const offer: TransactionInput = {
      commodity,
      quantity: this.cp.storage.getAvailableWares()[commodity],
      price: 0,
      budget: null,
      allocations: null,
      type: "sell",
      faction: this.cp.owner.value,
    };
    const allocations = allocate(commander, offer);

    if (allocations) {
      this.addOrder(
        tradeOrder(
          merge(
            {
              target: commander,
              offer,
            },
            {
              offer: {
                allocations: {
                  buyer: {
                    storage: allocations.storage.id,
                  },
                },
              },
            }
          )
        )
      );
    }
  };

  returnToFacility = () => {
    this.addOrder({
      type: "move",
      position: this.cp.commander.value.cp.position.value,
    });
    Object.values(commodities)
      .filter((commodity) => this.cp.storage.getAvailableWares()[commodity] > 0)
      .forEach(this.sellToCommander);
  };

  // eslint-disable-next-line class-methods-use-this
  holdPosition = () => false;

  simulate = (delta: number) => {
    this.cooldowns.update(delta);
    this.drive.sim(delta);

    if (this.orders.length && this.cooldowns.canUse("retryOrder")) {
      // eslint-disable-next-line no-unused-vars, no-shadow
      let orderFn: (delta: number, order: Order) => boolean;

      switch (this.orders[0].type) {
        case "trade":
          orderFn = this.tradeOrder;
          break;
        case "mine":
          orderFn = this.mineOrder;
          break;
        case "move":
          orderFn = this.moveOrder;
          break;
        default:
          orderFn = this.holdPosition;
      }

      const completed = orderFn(delta, this.orders[0]);
      if (completed) {
        this.orders = this.orders.slice(1);
      }
    }
  };
}
