import sortBy from "lodash/sortBy";
import { Sim } from "../sim";
import { perCommodity } from "../utils/perCommodity";
import { commodities, Commodity } from "./commodity";
import { Budget } from "../components/budget";
import { Allocation } from "../components/utils/allocations";
import { InvalidOfferType, NonPositiveAmount } from "../errors";
import { Entity } from "../components/entity";
import { Owner } from "../components/owner";
import { Trade, TradeOffer, TransactionInput } from "../components/trade";
import { CommodityStorage } from "../components/storage";
import { Position } from "../components/position";
import { Modules } from "../components/modules";
import { CompoundProduction } from "../components/production";
import { FacilityModule } from "../archetypes/facilityModule";

const maxTransactions = 100;

export function offerToStr(commodity: Commodity, offer: TradeOffer): string {
  return `${offer.type === "buy" ? "Buying" : "Selling"} ${
    offer.quantity
  } ${commodity} x ${offer.price} UTT`;
}

export class Facility extends Entity {
  name: string;

  constructor(sim: Sim) {
    super(sim);

    this.name = `Facility #${this.id}`;
    this.sim.facilities.push(this);

    this.cp.budget = new Budget();
    this.cp.compoundProduction = new CompoundProduction();
    this.cp.modules = new Modules();
    this.cp.owner = new Owner();
    this.cp.position = new Position();
    this.cp.storage = new CommodityStorage();
    this.cp.trade = new Trade();
  }

  select = () => {
    window.selected = this;
  };

  focus = () => {
    this.select();
    window.renderer.focused = this;
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

    this.cp.trade.transactions.push({
      ...input,
      time: this.sim.getTime(),
    });
    if (this.cp.trade.transactions.length > maxTransactions) {
      this.cp.trade.transactions.shift();
    }
  };

  addModule = (facilityModule: FacilityModule) => {
    this.cp.modules.modules.push(facilityModule);

    if (facilityModule.hasComponents(["production"])) {
      Object.keys(commodities).forEach((commodity: Commodity) => {
        this.cp.compoundProduction.pac[commodity].produces +=
          facilityModule.cp.production.pac[commodity].produces;
        this.cp.compoundProduction.pac[commodity].consumes +=
          facilityModule.cp.production.pac[commodity].consumes;
      });
    }

    if (facilityModule.hasComponents(["storageBonus"])) {
      this.cp.storage.max += facilityModule.cp.storageBonus.value;
    }
  };

  getNeededCommodities = (): Commodity[] => {
    const summedConsumption = this.cp.compoundProduction.getSummedConsumption();
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
              this.cp.compoundProduction.pac[data.commodity].consumes) /
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
}
