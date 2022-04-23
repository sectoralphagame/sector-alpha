import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import map from "lodash/map";
import { matrix, Matrix, sum } from "mathjs";
import { Sim } from "../sim";
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
import { InvalidOfferType, NonPositiveAmount } from "../errors";
import { createIsAbleToProduce } from "./utils";
import { limitMax, limitMin } from "../utils/limit";
import { Entity } from "../components/entity";

const startingPrice = 100;
const maxTransactions = 100;

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

export class Facility extends Entity {
  cooldowns: Cooldowns<"production" | "adjustPrices" | "settleBudget">;
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

  constructor(sim: Sim) {
    super(sim);

    this.productionAndConsumption = cloneDeep(baseProductionAndConsumption);
    this.cooldowns = new Cooldowns(
      "production",
      "adjustPrices",
      "settleBudget"
    );
    this.storage = new CommodityStorage(this.createOffers);
    this.createOffers();
    this.name = `Facility #${this.id}`;
    this.budget = new Budget();
    this.sim.facilities.push(this);
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
    this.offers = perCommodity((commodity): TradeOffer => {
      const quantity = this.getOfferedQuantity(commodity);

      return {
        price: (this.offers && this.offers[commodity].price) ?? startingPrice,
        quantity: quantity > 0 ? quantity : -quantity,
        type: quantity > 0 ? "sell" : "buy",
      };
    });
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

  getQuota = (commodity: Commodity): number =>
    Math.floor(
      (this.storage.max *
        (this.productionAndConsumption[commodity].produces +
          this.productionAndConsumption[commodity].consumes)) /
        this.getRequiredStorage()
    );

  /**
   *
   * @returns Commodity cost of production
   */
  getProductionCost = (commodity: Commodity): number => {
    const productionModule = this.modules.find(
      (m) => m.productionAndConsumption[commodity].produces > 0
    );

    if (!productionModule) {
      return this.offers[commodity].price;
    }

    return Math.ceil(
      sum(
        Object.values(
          perCommodity((c) =>
            productionModule.productionAndConsumption[c].consumes
              ? (this.getProductionCost(c) *
                  productionModule.productionAndConsumption[c].consumes) /
                productionModule.productionAndConsumption[commodity].produces
              : 0
          )
        )
      )
    );
  };

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
    const quota = this.getQuota(commodity);

    if (stored[commodity] > quota) {
      return stored[commodity] - quota;
    }

    const multiplier =
      requiredBudget > availableBudget ? availableBudget / requiredBudget : 1;

    return Math.floor(multiplier * (stored[commodity] - quota));
  };

  isTradeAccepted = (input: TransactionInput): boolean => {
    let validPrice = false;

    const offer = this.offers[input.commodity];

    if (offer.price < 0) {
      throw new NonPositiveAmount(offer.price);
    }

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
      time: this.sim.getTime(),
    });
    if (this.transactions.length > maxTransactions) {
      this.transactions.shift();
    }
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
                transaction.type !== this.offers[commodity].type
            )
            .map((h) => h.quantity)
        ) as number
    );
    const change = perCommodity(
      (commodity) =>
        quantities[commodity] - this.lastPriceAdjust.commodities[commodity]
    );

    perCommodity((commodity) => {
      const notOffered = this.offers[commodity].quantity <= 0;
      const stockpiled =
        this.offers[commodity].type === "buy" &&
        this.storage.getAvailableWares()[commodity] / this.getQuota(commodity) >
          0.8;

      if (stockpiled || notOffered) {
        return;
      }

      const minPrice =
        this.offers[commodity].type === "buy"
          ? 1
          : this.getProductionCost(commodity);
      let delta = limitMin(Math.floor(this.offers[commodity].price * 0.01), 1);
      if ((this.offers[commodity].type === "sell") === change[commodity] <= 0) {
        delta *= -1;
      }

      this.offers[commodity].price = limitMin(
        this.offers[commodity].price + delta,
        minPrice
      );
    });

    this.lastPriceAdjust = {
      commodities: quantities,
      time: this.sim.getTime(),
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

    const scores = sortBy(
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
    );

    return scores.map((offer) => offer.commodity);
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

  settleBudget = () => {
    const budgetChange =
      this.getPlannedBudget() - this.budget.getAvailableMoney();

    if (budgetChange < 0) {
      this.budget.transferMoney(
        limitMax(-budgetChange, this.budget.getAvailableMoney()),
        this.owner.budget
      );
    } else {
      this.owner.budget.transferMoney(
        limitMax(budgetChange, this.owner.budget.getAvailableMoney()),
        this.budget
      );
    }
  };

  simulate = (delta: number) => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("settleBudget")) {
      this.cooldowns.use("settleBudget", 60);
      this.settleBudget();
    }

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
              limitMax(
                this.getQuota(commodity) -
                  facilityModule.productionAndConsumption[commodity].produces,
                facilityModule.productionAndConsumption[commodity].produces
              ),
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
