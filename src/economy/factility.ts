import map from "lodash/map";
import every from "lodash/every";
import cloneDeep from "lodash/cloneDeep";
import { sum } from "mathjs";
import { sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { commodities, Commodity } from "./commodity";
import {
  baseProductionAndConsumption,
  FacilityModule,
  ProductionAndConsumption,
} from "./facilityModule";
import { InsufficientStorage } from "../errors";

let facilityIdCounter = 0;

export interface TradeOffer {
  price: number;
  quantity: number;
}

export type TradeOffers = Record<Commodity, TradeOffer>;

export interface Transaction extends TradeOffer {
  commodity: Commodity;
  time: number;
}

export interface FacilityStorage {
  max: number;
  stored: Record<Commodity, number>;
}

export class Facility {
  id: number;
  cooldowns: Cooldowns<"production">;
  money: number;
  offers: TradeOffers;
  productionAndConsumption: ProductionAndConsumption;
  transactions: Transaction[];
  storage: FacilityStorage;
  faction: string;
  modules: FacilityModule[];
  lastPriceAdjust: number;

  constructor() {
    this.id = facilityIdCounter;
    facilityIdCounter += 1;

    this.storage = {
      max: 0,
      stored: perCommodity(() => 0),
    };
    this.modules = [];
    this.productionAndConsumption = cloneDeep(baseProductionAndConsumption);
    this.offers = perCommodity(
      (commodity): TradeOffer => ({
        price: 1,
        quantity: this.getOfferedQuantity(commodity),
      })
    );
    this.cooldowns = new Cooldowns("production");
  }

  getProductionSurplus = (commodity: Commodity) =>
    this.productionAndConsumption[commodity].produces -
    this.productionAndConsumption[commodity].consumes;

  getSurplus = (commodity: Commodity) =>
    this.storage.stored[commodity] + this.getProductionSurplus(commodity);

  getOfferedQuantity = (commodity: Commodity) =>
    this.getProductionSurplus(commodity) > 0
      ? limitMax(this.storage.stored[commodity], this.storage.max)
      : limitMax(this.getProductionSurplus(commodity) * 2, this.storage.max);

  trade = (facility: Facility, commodity: Commodity, quantity: number) => {
    if (this.faction === facility.faction) {
      this.transactions.push({
        commodity,
        price: 0,
        quantity,
        time: sim.getTime(),
      });
    }
  };

  hasSufficientStorage = (commodity: Commodity, quantity: number): boolean =>
    this.storage.stored[commodity] >= quantity;

  addStorage = (commodity: Commodity, quantity: number): number => {
    const availableSpace = this.storage.max - sum(map(this.storage.stored));

    if (availableSpace >= quantity) {
      this.storage.stored[commodity] += quantity;
      return 0;
    }

    this.storage.stored[commodity] = this.storage.max;

    return quantity - availableSpace;
  };

  removeStorage = (commodity: Commodity, quantity: number) => {
    if (!this.hasSufficientStorage(commodity, quantity)) {
      throw new InsufficientStorage(quantity, this.storage.stored[commodity]);
    }

    this.storage.stored[commodity] -= quantity;
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
  };

  adjustPrices = () => {};

  sim = (delta: number) => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("production")) {
      if (
        every(
          perCommodity((commodity) =>
            this.hasSufficientStorage(
              commodity,
              this.productionAndConsumption[commodity].consumes
            )
          )
        )
      ) {
        console.log("producing");
        this.cooldowns.use("production", 15_000);
        // TODO: use allocations and postpone storing commodities until
        // finished producing
        perCommodity((commodity) =>
          this.removeStorage(
            commodity,
            this.productionAndConsumption[commodity].consumes
          )
        );
        perCommodity((commodity) =>
          this.addStorage(
            commodity,
            this.productionAndConsumption[commodity].produces
          )
        );
      }
    }
  };
}
