import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import { sum } from "mathjs";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { perCommodity } from "../utils/perCommodity";
import { commodities, Commodity } from "./commodity";
import {
  baseProductionAndConsumption,
  FacilityModule,
  ProductionAndConsumption,
} from "./facilityModule";
import { Faction } from "./faction";
import { Budget } from "../components/budget";
import { Allocation } from "../components/utils/allocations";
import { InvalidOfferType, NonPositiveAmount } from "../errors";
import { createIsAbleToProduce, getPlannedBudget } from "./utils";
import { limitMax, limitMin } from "../utils/limit";
import { Entity } from "../components/entity";
import { Owner } from "../components/owner";
import { startingPrice, Trade, TradeOffer } from "../components/trade";
import { CommodityStorage } from "../components/storage";
import { Position } from "../components/position";

const maxTransactions = 100;

export function offerToStr(commodity: Commodity, offer: TradeOffer): string {
  return `${offer.type === "buy" ? "Buying" : "Selling"} ${
    offer.quantity
  } ${commodity} x ${offer.price} UTT`;
}

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
  productionAndConsumption: ProductionAndConsumption;
  transactions: Transaction[] = [];
  modules: FacilityModule[] = [];
  lastPriceAdjust = {
    time: 0,
    commodities: perCommodity(() => 0),
  };
  name: string;

  constructor(sim: Sim) {
    super(sim);

    this.productionAndConsumption = cloneDeep(baseProductionAndConsumption);
    this.cooldowns = new Cooldowns(
      "production",
      "adjustPrices",
      "settleBudget"
    );
    this.name = `Facility #${this.id}`;
    this.sim.facilities.push(this);

    this.cp.budget = new Budget();
    this.cp.owner = new Owner();
    this.cp.position = new Position();
    this.cp.storage = new CommodityStorage(this.createOffers);
    this.cp.trade = new Trade();

    this.createOffers();
  }

  select = () => {
    window.selected = this;
  };

  focus = () => {
    this.select();
    window.renderer.focused = this;
  };

  createOffers = () => {
    this.cp.trade.offers = perCommodity((commodity): TradeOffer => {
      const quantity = this.getOfferedQuantity(commodity);

      return {
        price:
          (this.cp.trade.offers && this.cp.trade.offers[commodity].price) ??
          startingPrice,
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
          budget: this.cp.budget.allocations.new({
            amount: offer.price * offer.quantity,
          }),
          storage: this.cp.storage.allocationManager.new({
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
        storage: this.cp.storage.allocationManager.new({
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

  getProductionSurplus = (commodity: Commodity) =>
    this.productionAndConsumption[commodity].produces -
    this.productionAndConsumption[commodity].consumes;

  getSurplus = (commodity: Commodity) =>
    this.cp.storage.getAvailableWares()[commodity] +
    this.getProductionSurplus(commodity);

  getQuota = (commodity: Commodity): number =>
    Math.floor(
      (this.cp.storage.max *
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
      return this.cp.trade.offers[commodity].price;
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

    const stored = this.cp.storage.getAvailableWares();

    if (this.getProductionSurplus(commodity) > 0) {
      return (
        stored[commodity] -
        this.productionAndConsumption[commodity].consumes * 2
      );
    }

    const requiredBudget = getPlannedBudget(this);
    const availableBudget = this.cp.budget.getAvailableMoney();
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

    const offer = this.cp.trade.offers[input.commodity];

    if (offer.price < 0) {
      throw new NonPositiveAmount(offer.price);
    }

    if (offer.type === input.type && input.faction !== this.cp.owner.value) {
      throw new InvalidOfferType(input.type);
    }
    if (input.type === "buy") {
      if (input.faction === this.cp.owner.value) {
        validPrice = true;
      } else {
        validPrice = input.price >= offer.price;
      }

      return (
        validPrice &&
        this.cp.storage.hasSufficientStorage(input.commodity, input.quantity)
      );
    }

    if (input.faction === this.cp.owner.value) {
      validPrice = true;
    } else {
      validPrice = input.price <= offer.price;
    }

    return (
      validPrice &&
      this.cp.budget.getAvailableMoney() >= input.price * input.quantity &&
      this.cp.storage.hasSufficientStorageSpace(input.quantity)
    );
  };

  acceptTrade = (input: TransactionInput) => {
    if (input.price > 0) {
      // They are selling us
      if (input.type === "sell") {
        const allocation = this.cp.budget.allocations.release(
          input.allocations.buyer.budget
        );
        this.cp.budget.transferMoney(allocation.amount, input.budget);
      } else {
        const allocation = input.budget.allocations.release(
          input.allocations.buyer.budget
        );
        input.budget.transferMoney(allocation.amount, this.cp.budget);
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
    this.cp.storage.max += facilityModule.storage;
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
                transaction.type !== this.cp.trade.offers[commodity].type
            )
            .map((h) => h.quantity)
        ) as number
    );
    const change = perCommodity(
      (commodity) =>
        quantities[commodity] - this.lastPriceAdjust.commodities[commodity]
    );

    perCommodity((commodity) => {
      const notOffered = this.cp.trade.offers[commodity].quantity <= 0;
      const stockpiled =
        this.cp.trade.offers[commodity].type === "buy" &&
        this.cp.storage.getAvailableWares()[commodity] /
          this.getQuota(commodity) >
          0.8;

      if (stockpiled || notOffered) {
        return;
      }

      const minPrice =
        this.cp.trade.offers[commodity].type === "buy"
          ? 1
          : this.getProductionCost(commodity);
      let delta = limitMin(
        Math.floor(this.cp.trade.offers[commodity].price * 0.01),
        1
      );
      if (
        (this.cp.trade.offers[commodity].type === "sell") ===
        change[commodity] <= 0
      ) {
        delta *= -1;
      }

      this.cp.trade.offers[commodity].price = limitMin(
        this.cp.trade.offers[commodity].price + delta,
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
    const stored = this.cp.storage.getAvailableWares();

    const scores = sortBy(
      Object.values(commodities)
        .filter(
          (commodity) =>
            this.cp.trade.offers[commodity].type === "buy" &&
            this.cp.trade.offers[commodity].quantity > 0
        )
        .map((commodity) => ({
          commodity,
          wantToBuy: this.cp.trade.offers[commodity].quantity,
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
    const stored = this.cp.storage.getAvailableWares();

    return sortBy(
      Object.values(commodities)
        .map((commodity) => ({
          commodity,
          wantToSell:
            this.cp.trade.offers[commodity].type === "sell"
              ? this.cp.trade.offers[commodity].quantity
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

  simulate = (delta: number) => {
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
            this.cp.storage.removeStorage(
              commodity,
              facilityModule.productionAndConsumption[commodity].consumes
            )
          );
          perCommodity((commodity) =>
            this.cp.storage.addStorage(
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
