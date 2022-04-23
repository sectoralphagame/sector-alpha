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
import { Facility, TransactionInput } from "../../economy/factility";
import { CommodityStorage } from "../../economy/storage";
import {
  mineOrder,
  MineOrder,
  MoveOrder,
  tradeOrder,
  TradeOrder,
  Order,
} from "./orders";
import {
  commodities,
  Commodity,
  mineableCommodities,
} from "../../economy/commodity";
import { Sim } from "../../sim";
import { Faction } from "../../economy/faction";
import { Cooldowns } from "../../utils/cooldowns";
import {
  getFacilityWithMostProfit,
  getClosestMineableAsteroid,
} from "../../economy/utils";
import { limitMin } from "../../utils/limit";
import { ShipDrive, ShipDriveProps } from "./drive";
import { Entity } from "../../components/entity";

export interface InitialShipInput {
  name: string;
  position: Matrix;
  drive: ShipDriveProps;
  sim: Sim;
  storage: number;
  mining: number;
}

export type MainOrderType = "trade" | "mine";

export class Ship extends Entity {
  name: string;
  drive: ShipDrive;
  position: Matrix;
  storage: CommodityStorage;
  owner: Faction;
  commander: Facility | null;
  orders: Order[];
  cooldowns: Cooldowns<"retryOrder" | "autoOrder" | "mine" | "cruise">;
  mining: number;
  mined: number;
  retryOrderCounter: number = 0;
  mainOrder: MainOrderType;

  constructor(initial: InitialShipInput) {
    super(initial.sim);

    this.name = initial.name;
    this.drive = new ShipDrive(initial.drive);
    this.storage = new CommodityStorage();
    this.storage.max = initial.storage;
    this.owner = null;
    this.commander = null;
    this.orders = [];
    this.position = cloneDeep(initial.position);
    this.cooldowns = new Cooldowns("retryOrder", "autoOrder", "mine", "cruise");
    this.cooldowns.use("autoOrder", 1);
    this.mining = initial.mining;
    this.mined = 0;

    this.sim.ships.push(this);
  }

  select = () => {
    window.selected = this;
  };

  focus = () => {
    this.select();
    window.renderer.focused = this;
  };

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
      this.position = matrix(position);
      return true;
    }

    if (canCruise && this.drive.state === "maneuver") {
      this.drive.startCruise();
    }

    if (!canCruise && this.drive.state === "cruise") {
      this.drive.stopCruise();
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
    const target = getFacilityWithMostProfit(this.commander, commodity);

    if (!target) return false;

    return this.tradeCommodity(commodity, this.commander, target);
  };

  autoSellMostRedundantToCommander = (commodity: Commodity): boolean => {
    const target = getFacilityWithMostProfit(this.commander, commodity);

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

    const quantity = Math.floor(
      min(
        buyer.offers[commodity].quantity,
        this.storage.max,
        seller.offers[commodity].quantity,
        sameFaction
          ? Infinity
          : this.commander.budget.getAvailableMoney() /
              this.commander.offers[commodity].price
      )
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
    if (!sellerAllocations) {
      buyer.budget.allocations.release(buyerAllocations.budget.id);
      buyer.storage.allocationManager.release(buyerAllocations.storage.id);
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

  autoTrade = () => {
    if (this.storage.getAvailableSpace() !== this.storage.max) {
      this.returnToFacility();
    } else {
      const bought = this.commander
        .getNeededCommodities()
        .reduce((acc, commodity) => {
          if (acc) {
            return true;
          }

          return this.autoBuyMostNeededByCommander(commodity);
        }, false);

      if (bought) {
        return;
      }

      this.commander.getCommoditiesForSell().reduce((acc, commodity) => {
        if (acc) {
          return true;
        }

        return this.autoSellMostRedundantToCommander(commodity);
      }, false);
    }
  };

  mineOrder = (delta: number, order: MineOrder): boolean => {
    if (order.targetRock?.mined !== this.id) {
      order.targetRock = getClosestMineableAsteroid(
        order.target,
        this.position
      );
      if (!order.targetRock) return false;
    }
    const rockReached = this.moveTo(delta, order.targetRock.position);

    if (rockReached) {
      if (this.cooldowns.canUse("mine")) {
        this.cooldowns.use("mine", 5);
        this.storage.addStorage(
          order.target.type,
          Math.floor(this.mined),
          false
        );
        this.mined = 0;
      }
      order.targetRock.mined = this.id;
      this.mined += this.mining * delta;

      if (this.storage.getAvailableSpace() === 0) {
        order.targetRock.mined = null;
        return true;
      }
    }

    return false;
  };

  autoMine = () => {
    if (this.storage.getAvailableSpace() !== this.storage.max) {
      this.returnToFacility();
    } else {
      const needed = this.commander.getNeededCommodities();
      const mineable = needed.find((commodity) =>
        (Object.values(mineableCommodities) as string[]).includes(commodity)
      );

      if (mineable) {
        const field = this.sim.fields.find((f) => f.type === mineable);
        const rock = getClosestMineableAsteroid(field, this.position);

        if (rock) {
          this.addOrder(
            mineOrder({
              target: field,
              targetRock: rock,
            })
          );
        }
      }
    }
  };

  moveOrder = (delta: number, order: MoveOrder): boolean =>
    this.moveTo(delta, order.position);

  autoOrder = () => {
    if (this.orders.length !== 0) {
      return;
    }

    switch (this.mainOrder) {
      case "mine":
        this.autoMine();
        break;
      default:
        this.autoTrade();
    }
  };

  sellToCommander = (commodity: Commodity) => {
    const offer: TransactionInput = {
      commodity,
      quantity: this.storage.getAvailableWares()[commodity],
      price: 0,
      budget: null,
      allocations: null,
      type: "sell",
      faction: this.owner,
    };
    const allocations = this.commander.allocate(offer);

    if (allocations) {
      this.addOrder(
        tradeOrder(
          merge(
            {
              target: this.commander,
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
    this.addOrder({ type: "move", position: this.commander.position });
    Object.values(commodities)
      .filter((commodity) => this.storage.getAvailableWares()[commodity] > 0)
      .forEach(this.sellToCommander);
  };

  // eslint-disable-next-line class-methods-use-this
  holdPosition = () => false;

  simulate = (delta: number) => {
    this.cooldowns.update(delta);
    this.drive.sim(delta);

    if (this.orders.length) {
      if (this.cooldowns.canUse("retryOrder")) {
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
    } else if (this.commander && this.cooldowns.canUse("autoOrder")) {
      this.autoOrder();
      this.cooldowns.use("autoOrder", 3);
    }
  };
}
