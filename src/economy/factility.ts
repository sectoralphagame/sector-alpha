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
import { Ship } from "../entities/ship";
import { Budget } from "./budget";

let facilityIdCounter = 0;

export interface TradeOffer {
  price: number;
  quantity: number;
}

export function offerToStr(commodity: Commodity, offer: TradeOffer): string {
  return `${offer.quantity} ${commodity} x ${offer.price} UTT`;
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
}

export class Facility {
  id: number;
  cooldowns: Cooldowns<"production" | "shipDispatch">;
  offers: TradeOffers;
  productionAndConsumption: ProductionAndConsumption;
  transactions: Transaction[];
  storage: CommodityStorage;
  faction: Faction;
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
    this.storage = new CommodityStorage();
    this.createOffers();
    this.ships = [];
    this.transactions = [];
    this.name = `Facility #${this.id}`;
    this.budget = new Budget();
  }

  addShip = (ship: Ship) => {
    ship.setOwner(this.faction);
    ship.setCommander(this);
    this.ships.push(ship);
  };

  removeShip = (ship: Ship) => {
    this.ships = this.ships.filter((s) => s.id !== ship.id);
    ship.clearCommander();
  };

  createOffers = () => {
    this.offers = perCommodity(
      (commodity): TradeOffer => ({
        price: 1,
        quantity: this.getOfferedQuantity(commodity),
      })
    );
  };

  getPlannedBudget = (): number =>
    sum(map(this.offers).map((offer) => -offer.price * offer.quantity));

  getProductionSurplus = (commodity: Commodity) =>
    this.productionAndConsumption[commodity].produces -
    this.productionAndConsumption[commodity].consumes;

  getSurplus = (commodity: Commodity) =>
    this.storage.stored[commodity] + this.getProductionSurplus(commodity);

  getOfferedQuantity = (commodity: Commodity) =>
    this.getRequiredStorage() === 0
      ? this.getSurplus(commodity)
      : this.getProductionSurplus(commodity) > 0
      ? this.storage.stored[commodity] -
        this.productionAndConsumption[commodity].consumes * 2
      : this.storage.max *
          (this.getProductionSurplus(commodity) / this.getRequiredStorage()) +
        this.storage.stored[commodity];

  isTradeAccepted = (input: TransactionInput): boolean => {
    if (input.faction === this.faction) {
      return true;
    }

    const offer = this.offers[input.commodity];

    // Do not accept ship's buy request if facility wants to buy
    // Same goes for selling
    if (offer.quantity * input.quantity > 0) {
      return false;
    }
    // Facility wants to sell
    if (offer.quantity > 0) {
      return (
        input.price >= offer.price &&
        input.budget.money >= input.price * -input.quantity
      );
    }

    return (
      input.price <= offer.price &&
      this.budget.money >= input.price * -input.quantity
    );
  };

  acceptTrade = (input: TransactionInput) => {
    if (input.quantity > 0) {
      input.budget.transferMoney(input.quantity * input.price, this.budget);
    } else {
      this.budget.transferMoney(-input.quantity * input.price, input.budget);
    }
    this.transactions.push({
      ...input,
      time: sim.getTime(),
    });
  };

  addStorage = (
    commodity: Commodity,
    quantity: number,
    recreateOffers = false
  ): number => {
    const surplus = this.storage.addStorage(commodity, quantity);
    if (recreateOffers) {
      this.createOffers();
    }

    return surplus;
  };

  removeStorage = (
    commodity: Commodity,
    quantity: number,
    recreateOffers = false
  ) => {
    this.storage.removeStorage(commodity, quantity);
    if (recreateOffers) {
      this.createOffers();
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

    return sortBy(
      Object.values(commodities)
        .map((commodity) => ({
          commodity,
          wantToBuy: this.offers[commodity].quantity,
          quantityStored: this.storage.stored[commodity],
        }))
        .filter((offer) => offer.wantToBuy < 0)
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

  getCommoditiesForSell = (): Commodity[] =>
    sortBy(
      Object.values(commodities)
        .map((commodity) => ({
          commodity,
          wantToSell: this.offers[commodity].quantity,
          quantityStored: this.storage.stored[commodity],
        }))
        .filter((offer) => offer.wantToSell > 0)
        .map((data) => ({
          commodity: data.commodity,
          score: data.quantityStored,
        })),
      "score"
    ).map((offer) => offer.commodity);

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
            this.removeStorage(
              commodity,
              facilityModule.productionAndConsumption[commodity].consumes,
              false
            )
          );
          perCommodity((commodity) =>
            this.addStorage(
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

        const factionFacility = this.faction.facilities.find(
          (facility) => facility.offers[mostNeededCommodity].quantity > 0
        );
        if (factionFacility) {
          const ship = idleShips.pop();
          ship.addOrder({
            type: "trade",
            target: factionFacility,
            offer: {
              price: 0,
              quantity: -min(
                -this.offers[mostNeededCommodity].quantity,
                ship.storage.max,
                factionFacility.offers[mostNeededCommodity].quantity,
                this.budget.money / this.offers[mostNeededCommodity].price
              ),
              commodity: mostNeededCommodity,
              faction: this.faction,
              budget: this.budget,
            },
          });
          continue;
        }

        const friendlyFacility = sim.factions
          .filter((faction) => faction.slug !== this.faction.slug)
          .map((faction) => faction.facilities)
          .flat()
          .find(
            (facility) => facility.offers[mostNeededCommodity].quantity > 0
          );
        if (friendlyFacility) {
          const ship = idleShips.pop();
          ship.addOrder({
            type: "trade",
            target: friendlyFacility,
            offer: {
              price: friendlyFacility.offers[mostNeededCommodity].price,
              quantity: -min(
                -this.offers[mostNeededCommodity].quantity,
                ship.storage.max,
                friendlyFacility.offers[mostNeededCommodity].quantity,
                this.budget.money / this.offers[mostNeededCommodity].price
              ),
              commodity: mostNeededCommodity,
              faction: this.faction,
              budget: this.budget,
            },
          });
        }
      }

      const sellable = this.getCommoditiesForSell();

      while (sellable.length > 0 && idleShips.length) {
        const commodityForSell = sellable.shift();

        const factionFacility = this.faction.facilities.find(
          (facility) => facility.offers[commodityForSell].quantity < 0
        );
        if (factionFacility) {
          const ship = idleShips.pop();
          const quantity = min(
            this.offers[commodityForSell].quantity,
            ship.storage.max,
            -factionFacility.offers[commodityForSell].quantity
          );
          ship.addOrder({
            type: "trade",
            target: this,
            offer: {
              price: 0,
              quantity: -quantity,
              commodity: commodityForSell,
              faction: this.faction,
              budget: this.budget,
            },
          });
          ship.addOrder({
            type: "trade",
            target: factionFacility,
            offer: {
              price: 0,
              quantity,
              commodity: commodityForSell,
              faction: this.faction,
              budget: this.budget,
            },
          });
          continue;
        }

        const friendlyFacility = sim.factions
          .filter((faction) => faction.slug !== this.faction.slug)
          .map((faction) => faction.facilities)
          .flat()
          .find((facility) => facility.offers[commodityForSell].quantity < 0);
        if (friendlyFacility) {
          const ship = idleShips.pop();
          const quantity = min(
            this.offers[commodityForSell].quantity,
            ship.storage.max,
            -friendlyFacility.offers[commodityForSell].quantity
          );
          ship.addOrder({
            type: "trade",
            target: this,
            offer: {
              price: 0,
              quantity: -quantity,
              commodity: commodityForSell,
              faction: this.faction,
              budget: this.budget,
            },
          });
          ship.addOrder({
            type: "trade",
            target: friendlyFacility,
            offer: {
              price: friendlyFacility.offers[commodityForSell].price,
              quantity,
              commodity: commodityForSell,
              faction: this.faction,
              budget: this.budget,
            },
          });
        }
      }
    }
  };
}
