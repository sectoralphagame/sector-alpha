import every from "lodash/every";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import map from "lodash/map";
import { matrix, Matrix, min, sum } from "mathjs";
import { sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { perCommodity } from "../utils/perCommodity";
import { commodities, Commodity } from "./commodity";
import {
  baseProductionAndConsumption,
  FacilityModule,
  ProductionAndConsumption,
} from "./facilityModule";
import { CommodityStorage } from "./storage";
import { Faction } from "./faction";
import { Ship, tradeOrder } from "../entities/ship";
import { Budget } from "./budget";
import { getClosestFacility } from "./utils";
import { limitMin } from "../utils/limit";

let facilityIdCounter = 0;

export type TradeOfferType = "buy" | "sell";

export interface TradeOffer {
  price: number;
  quantity: number;
  type: TradeOfferType;
}

export function offerToStr(commodity: Commodity, offer: TradeOffer): string {
  return `${offer.type === "buy" ? "Buying" : "Selling"} ${
    offer.quantity
  } ${commodity} x ${offer.price} UTT`;
}

export type TradeOffers = Record<Commodity, TradeOffer>;

export interface Transaction extends TradeOffer {
  commodity: Commodity;
  time: number;
}

export interface TransactionInput extends TradeOffer {
  commodity: Commodity;
  faction: Faction;
  budget: Budget;
  allocation: number | null;
}

export class Facility {
  id: number;
  cooldowns: Cooldowns<"production" | "shipDispatch">;
  offers: TradeOffers;
  productionAndConsumption: ProductionAndConsumption;
  transactions: Transaction[];
  storage: CommodityStorage;
  owner: Faction;
  position: Matrix;
  modules: FacilityModule[];
  lastPriceAdjust: number;
  ships: Ship[];
  name: string;
  budget: Budget;

  constructor() {
    this.id = facilityIdCounter;
    facilityIdCounter += 1;

    this.modules = [];
    this.productionAndConsumption = cloneDeep(baseProductionAndConsumption);
    this.cooldowns = new Cooldowns("production", "shipDispatch");
    this.position = matrix([0, 0]);
    this.storage = new CommodityStorage(this.createOffers);
    this.createOffers();
    this.ships = [];
    this.transactions = [];
    this.name = `Facility #${this.id}`;
    this.budget = new Budget();
  }

  setOwner = (owner: Faction) => {
    this.owner = owner;
    this.ships.forEach((ship) => ship.setOwner(this.owner));
  };
  clearOwner = () => {
    this.owner = null;
    this.ships.forEach((ship) => ship.setOwner(this.owner));
  };

  addShip = (ship: Ship) => {
    ship.setOwner(this.owner);
    ship.setCommander(this);
    this.ships.push(ship);
  };

  removeShip = (ship: Ship) => {
    this.ships = this.ships.filter((s) => s.id !== ship.id);
    ship.clearCommander();
  };

  createOffers = () => {
    this.offers = perCommodity(
      (commodity): TradeOffer => {
        const quantity = this.getOfferedQuantity(commodity);

        return {
          price: 1,
          quantity: quantity > 0 ? quantity : -quantity,
          type: quantity > 0 ? "sell" : "buy",
        };
      }
    );
  };

  /**
   *
   * @returns Minimum required money to fulfill all buy requests, not taking
   * into account sell offers
   */
  getPlannedBudget = (): number =>
    sum(
      map(this.offers).map(
        (offer) => (offer.type === "sell" ? 0 : offer.quantity) * offer.price
      )
    );

  getProductionSurplus = (commodity: Commodity) =>
    this.productionAndConsumption[commodity].produces -
    this.productionAndConsumption[commodity].consumes;

  getSurplus = (commodity: Commodity) =>
    this.storage.getAvailableWares()[commodity] +
    this.getProductionSurplus(commodity);

  getOfferedQuantity = (commodity: Commodity) => {
    if (
      this.productionAndConsumption[commodity].consumes ===
        this.productionAndConsumption[commodity].produces &&
      this.productionAndConsumption[commodity].consumes === 0
    ) {
      return this.getSurplus(commodity);
    }

    const stored = this.storage.getAvailableWares();

    if (this.getProductionSurplus(commodity) > 0) {
      return (
        stored[commodity] -
        this.productionAndConsumption[commodity].consumes * 2
      );
    }

    const requiredBudget = this.getPlannedBudget();
    const availableBudget = this.budget.getAvailableMoney();
    const requiredQuantity = Math.floor(
      -this.storage.max *
        (this.getProductionSurplus(commodity) / this.getRequiredStorage())
    );

    if (stored[commodity] > requiredQuantity) {
      return stored[commodity] - requiredQuantity;
    }

    const multiplier =
      requiredBudget > availableBudget ? availableBudget / requiredBudget : 1;

    return Math.ceil(multiplier * (stored[commodity] - requiredQuantity));
  };

  isTradeAccepted = (input: TransactionInput): boolean => {
    let hasBudget = false;
    let validPrice = false;

    const offer = this.offers[input.commodity];

    if (offer.type === input.type) {
      return false;
    }
    if (input.type === "buy") {
      hasBudget =
        input.allocation !== null ||
        input.budget.getAvailableMoney() >= input.price * input.quantity;
      validPrice = input.price >= offer.price;

      if (input.faction === this.owner) {
        hasBudget = true;
        validPrice = true;
      }

      return (
        validPrice &&
        hasBudget &&
        this.storage.hasSufficientStorage(input.commodity, input.quantity)
      );
    }

    hasBudget = this.budget.getAvailableMoney() >= input.price * input.quantity;
    validPrice = input.price <= offer.price;

    if (input.faction === this.owner) {
      hasBudget = true;
      validPrice = true;
    }

    return (
      validPrice &&
      hasBudget &&
      this.storage.hasSufficientStorageSpace(input.quantity)
    );
  };

  acceptTrade = (input: TransactionInput) => {
    if (input.price > 0) {
      // They are selling us
      if (input.type === "sell") {
        this.budget.transferMoney(input.quantity * input.price, input.budget);
      } else if (input.allocation) {
        const allocation = input.budget.allocations.release(input.allocation);
        input.budget.transferMoney(allocation.amount, this.budget);
      } else {
        input.budget.transferMoney(input.quantity * input.price, this.budget);
      }
    }

    this.transactions.push({
      ...input,
      time: sim.getTime(),
    });
  };

  addModule = (facilityModule: FacilityModule) => {
    this.modules.push(facilityModule);
    Object.keys(commodities).forEach((commodity: Commodity) => {
      this.productionAndConsumption[commodity].produces +=
        facilityModule.productionAndConsumption[commodity].produces;
      this.productionAndConsumption[commodity].consumes +=
        facilityModule.productionAndConsumption[commodity].consumes;
    });
    this.storage.max += facilityModule.storage;
    this.createOffers();
  };

  adjustPrices = () => {};

  getSummedConsumption = () =>
    sum(
      Object.values(commodities).map(
        (commodity) => this.productionAndConsumption[commodity].consumes
      )
    );

  getSummedProduction = () =>
    sum(
      Object.values(commodities).map(
        (commodity) => this.productionAndConsumption[commodity].produces
      )
    );

  getRequiredStorage = () =>
    this.getSummedConsumption() + this.getSummedProduction();

  getNeededCommodities = (): Commodity[] => {
    const summedConsumption = this.getSummedConsumption();
    const stored = this.storage.getAvailableWares();

    return sortBy(
      Object.values(commodities)
        .filter(
          (commodity) =>
            this.offers[commodity].type === "buy" &&
            this.offers[commodity].quantity > 0
        )
        .map((commodity) => ({
          commodity,
          wantToBuy: this.offers[commodity].quantity,
          quantityStored: stored[commodity],
        }))
        .map((data) => ({
          commodity: data.commodity,
          score:
            (data.quantityStored -
              this.productionAndConsumption[data.commodity].consumes) /
            summedConsumption,
        })),
      "score"
    ).map((offer) => offer.commodity);
  };

  getCommoditiesForSell = (): Commodity[] => {
    const stored = this.storage.getAvailableWares();

    return sortBy(
      Object.values(commodities)
        .map((commodity) => ({
          commodity,
          wantToSell: this.offers[commodity].quantity,
          quantityStored: stored[commodity],
        }))
        .filter((offer) => offer.wantToSell > 0)
        .map((data) => ({
          commodity: data.commodity,
          score: data.quantityStored,
        })),
      "score"
    ).map((offer) => offer.commodity);
  };

  sim = (delta: number) => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("production")) {
      const modulesAbleToProduce = this.modules.filter((facilityModule) =>
        every(
          perCommodity((commodity) =>
            this.storage.hasSufficientStorage(
              commodity,
              facilityModule.productionAndConsumption[commodity].consumes
            )
          )
        )
      );
      if (modulesAbleToProduce.length) {
        this.cooldowns.use("production", 15);
        // TODO: use allocations and postpone storing commodities until
        // finished producing

        modulesAbleToProduce.forEach((facilityModule) => {
          perCommodity((commodity) =>
            this.storage.removeStorage(
              commodity,
              facilityModule.productionAndConsumption[commodity].consumes
            )
          );
          perCommodity((commodity) =>
            this.storage.addStorage(
              commodity,
              facilityModule.productionAndConsumption[commodity].produces,
              false
            )
          );
        });
        this.createOffers();
      }
    }

    if (this.cooldowns.canUse("shipDispatch")) {
      this.cooldowns.use("shipDispatch", 1);

      const idleShips = this.ships.filter((ship) => ship.idle);
      if (idleShips.length === 0) {
        return;
      }

      const needs = this.getNeededCommodities();

      while (needs.length > 0 && idleShips.length) {
        const mostNeededCommodity = needs.shift();

        const factionFacility = getClosestFacility(
          this.owner.facilities.filter(
            (facility) =>
              facility.offers[mostNeededCommodity].quantity > 0 &&
              facility.offers[mostNeededCommodity].type === "sell"
          ),
          this.position
        );
        if (factionFacility) {
          const ship = idleShips.pop();
          const order = tradeOrder({
            target: factionFacility,
            offer: {
              price: 0,
              quantity: min(
                this.offers[mostNeededCommodity].quantity,
                ship.storage.max,
                factionFacility.offers[mostNeededCommodity].quantity,
                this.budget.getAvailableMoney() /
                  this.offers[mostNeededCommodity].price
              ),
              commodity: mostNeededCommodity,
              faction: this.owner,
              budget: this.budget,
              allocation: null,
              type: "buy",
            },
          });
          if (order) {
            ship.addOrder(order);
          } else {
            idleShips.push(ship);
          }
          continue;
        }

        const friendlyFacility = getClosestFacility(
          sim.factions
            .filter((faction) => faction.slug !== this.owner.slug)
            .map((faction) => faction.facilities)
            .flat()
            .filter(
              (facility) =>
                facility.offers[mostNeededCommodity].quantity > 0 &&
                facility.offers[mostNeededCommodity].type === "sell"
            ),
          this.position
        );
        if (friendlyFacility) {
          const ship = idleShips.pop();
          const quantity = min(
            this.offers[mostNeededCommodity].quantity,
            ship.storage.max,
            friendlyFacility.offers[mostNeededCommodity].quantity,
            this.budget.getAvailableMoney() /
              this.offers[mostNeededCommodity].price
          );
          if (quantity <= 0) {
            idleShips.push(ship);
            continue;
          }
          const allocation = this.budget.allocations.new({
            amount:
              quantity * friendlyFacility.offers[mostNeededCommodity].price,
          });

          const order = tradeOrder({
            target: friendlyFacility,
            offer: {
              price: friendlyFacility.offers[mostNeededCommodity].price,
              quantity,
              commodity: mostNeededCommodity,
              faction: this.owner,
              budget: this.budget,
              allocation: allocation.id,
              type: "buy",
            },
          });

          if (order) {
            ship.addOrder(order);
          } else {
            idleShips.push(ship);
          }
          continue;
        }
      }

      const sellable = this.getCommoditiesForSell();

      while (sellable.length > 0 && idleShips.length) {
        const commodityForSell = sellable.shift();

        const factionFacility = getClosestFacility(
          this.owner.facilities.filter(
            (facility) =>
              facility.offers[commodityForSell].quantity > 0 &&
              facility.offers[commodityForSell].type === "buy"
          ),
          this.position
        );
        if (factionFacility) {
          const ship = idleShips.pop();
          const quantity = min(
            this.offers[commodityForSell].quantity,
            ship.storage.max,
            factionFacility.offers[commodityForSell].quantity
          );
          if (quantity <= 0) {
            idleShips.push(ship);
            continue;
          }
          ship.addOrder({
            type: "trade",
            target: this,
            offer: {
              price: 0,
              quantity,
              commodity: commodityForSell,
              faction: this.owner,
              budget: this.budget,
              allocation: null,
              type: "buy",
            },
          });
          ship.addOrder({
            type: "trade",
            target: factionFacility,
            offer: {
              price: 0,
              quantity,
              commodity: commodityForSell,
              faction: this.owner,
              budget: this.budget,
              allocation: null,
              type: "sell",
            },
          });
          continue;
        }

        const friendlyFacility = getClosestFacility(
          sim.factions
            .filter((faction) => faction.slug !== this.owner.slug)
            .map((faction) => faction.facilities)
            .flat()
            .filter(
              (facility) =>
                facility.offers[commodityForSell].quantity > 0 &&
                facility.offers[commodityForSell].type === "buy"
            ),
          this.position
        );
        if (friendlyFacility) {
          const ship = idleShips.pop();
          const quantity = min(
            this.offers[commodityForSell].quantity,
            ship.storage.max,
            friendlyFacility.offers[commodityForSell].quantity
          );
          ship.addOrder({
            type: "trade",
            target: this,
            offer: {
              price: 0,
              quantity,
              commodity: commodityForSell,
              faction: this.owner,
              budget: this.budget,
              allocation: null,
              type: "buy",
            },
          });
          ship.addOrder({
            type: "trade",
            target: friendlyFacility,
            offer: {
              price: friendlyFacility.offers[commodityForSell].price,
              quantity,
              commodity: commodityForSell,
              faction: this.owner,
              budget: this.budget,
              allocation: null,
              type: "sell",
            },
          });
        }
      }
    }
  };
}
