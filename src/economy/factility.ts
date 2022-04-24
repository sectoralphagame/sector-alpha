import sortBy from "lodash/sortBy";
import { Sim } from "../sim";
import { commodities, Commodity } from "./commodity";
import { Budget } from "../components/budget";
import { Entity } from "../components/entity";
import { Owner } from "../components/owner";
import { Trade, TradeOffer } from "../components/trade";
import { CommodityStorage } from "../components/storage";
import { Position } from "../components/position";
import { Modules } from "../components/modules";
import { CompoundProduction } from "../components/production";
import { FacilityModule } from "../archetypes/facilityModule";

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
