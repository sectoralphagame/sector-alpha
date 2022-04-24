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
import { Selection } from "../components/selection/selection";

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
    this.cp.selection = new Selection();
    this.cp.storage = new CommodityStorage();
    this.cp.trade = new Trade();
  }

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
}
