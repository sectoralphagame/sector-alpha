import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import map from "lodash/map";
import { matrix, Matrix, number, sum } from "mathjs";
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
import { Ship } from "../entities/ship";
import { Budget } from "./budget";
import { Allocation } from "./allocations";
import { InvalidOfferType } from "../errors";
import { createIsAbleToProduce } from "./utils";

let facilityIdCounter = 0;
const startingPrice = 100;

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
  allocations: Record<
    "buyer" | "seller",
    {
      budget: number | null;
      storage: number | null;
    }
  >;
}

export class Facility {
  id: number;
  cooldowns: Cooldowns<"production" | "adjustPrices">;
  offers: TradeOffers;
  productionAndConsumption: ProductionAndConsumption;
  transactions: Transaction[] = [];
  storage: CommodityStorage;
  owner: Faction;
  position: Matrix = matrix([0, 0]);
  modules: FacilityModule[] = [];
  lastPriceAdjust = {
    time: 0,
    commodities: perCommodity(() => 0),
  };
  ships: Ship[] = [];
  name: string;
  budget: Budget;

  constructor() {
    this.id = facilityIdCounter;
    facilityIdCounter += 1;

    this.productionAndConsumption = cloneDeep(baseProductionAndConsumption);
    this.cooldowns = new Cooldowns("production", "adjustPrices");
    this.storage = new CommodityStorage(this.createOffers);
    this.createOffers();
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
          price: (this.offers && this.offers[commodity].price) ?? startingPrice,
          quantity: quantity > 0 ? quantity : -quantity,
          type: quantity > 0 ? "sell" : "buy",
        };
      }
    );
  };

  /**
   * Allocates resources necessary to finish trade before it is actually done
   */
  allocate = (
    offer: TransactionInput
  ): Record<"budget" | "storage", Allocation> | null => {
    if (this.isTradeAccepted(offer)) {
      if (offer.type === "sell") {
        return {
          budget: this.budget.allocations.new({
            amount: offer.price * offer.quantity,
          }),
          storage: this.storage.allocationManager.new({
            amount: {
              ...perCommodity(() => 0),
              [offer.commodity]: offer.quantity,
            },
            type: "incoming",
          }),
        };
      }

      return {
        budget: null,
        storage: this.storage.allocationManager.new({
          amount: {
            ...perCommodity(() => 0),
            [offer.commodity]: offer.quantity,
          },
          type: "outgoing",
        }),
      };
    }

    return null;
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

    return Math.floor(multiplier * (stored[commodity] - requiredQuantity));
  };

  isTradeAccepted = (input: TransactionInput): boolean => {
    let validPrice = false;

    const offer = this.offers[input.commodity];

    if (offer.type === input.type && input.faction !== this.owner) {
      throw new InvalidOfferType(input.type);
    }
    if (input.type === "buy") {
      if (input.faction === this.owner) {
        validPrice = true;
      } else {
        validPrice = input.price >= offer.price;
      }

      return (
        validPrice &&
        this.storage.hasSufficientStorage(input.commodity, input.quantity)
      );
    }

    if (input.faction === this.owner) {
      validPrice = true;
    } else {
      validPrice = input.price <= offer.price;
    }

    return (
      validPrice &&
      this.budget.getAvailableMoney() >= input.price * input.quantity &&
      this.storage.hasSufficientStorageSpace(input.quantity)
    );
  };

  acceptTrade = (input: TransactionInput) => {
    if (input.price > 0) {
      // They are selling us
      if (input.type === "sell") {
        const allocation = this.budget.allocations.release(
          input.allocations.buyer.budget
        );
        this.budget.transferMoney(allocation.amount, input.budget);
      } else {
        const allocation = input.budget.allocations.release(
          input.allocations.buyer.budget
        );
        input.budget.transferMoney(allocation.amount, this.budget);
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

  adjustPrices = () => {
    const quantities = perCommodity(
      (commodity) =>
        sum(
          this.transactions
            .filter(
              (transaction) =>
                transaction.commodity === commodity &&
                transaction.time > this.lastPriceAdjust.time &&
                transaction.price > 0
            )
            .map((h) => h.quantity)
        ) as number
    );
    const change = perCommodity(
      (commodity) =>
        quantities[commodity] - this.lastPriceAdjust.commodities[commodity]
    );

    perCommodity((commodity) => {
      if (this.offers[commodity].quantity > 0) {
        this.offers[commodity].price = Math.floor(
          this.offers[commodity].price * (change[commodity] > 0 ? 0.99 : 1.01)
        );
      }
    });

    this.lastPriceAdjust = {
      commodities: quantities,
      time: sim.getTime(),
    };
  };

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
          wantToSell:
            this.offers[commodity].type === "sell"
              ? this.offers[commodity].quantity
              : 0,
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
      const isAbleToProduce = createIsAbleToProduce(this);
      const modulesAbleToProduce = this.modules.filter(isAbleToProduce);
      if (modulesAbleToProduce.length) {
        this.cooldowns.use("production", 15);
        // TODO: use allocations and postpone storing commodities until
        // finished producing

        this.modules.forEach((facilityModule) => {
          if (!isAbleToProduce(facilityModule)) {
            return;
          }

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

    if (this.cooldowns.canUse("adjustPrices")) {
      this.cooldowns.use("adjustPrices", 300);
      this.adjustPrices();
    }
  };
}
