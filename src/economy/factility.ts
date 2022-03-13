import every from "lodash/every";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
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
}

export class Facility {
  id: number;
  cooldowns: Cooldowns<"production" | "shipDispatch">;
  money: number;
  offers: TradeOffers;
  productionAndConsumption: ProductionAndConsumption;
  transactions: Transaction[];
  storage: CommodityStorage;
  faction: Faction;
  position: Matrix;
  modules: FacilityModule[];
  lastPriceAdjust: number;
  ships: Ship[];

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
        input.faction.money >= input.price * input.quantity
      );
    }

    return (
      input.price <= offer.price && this.money >= input.price * -input.quantity
    );
  };

  acceptTrade = (input: TransactionInput) => {
    this.changeMoney(-input.quantity * input.price);
    this.transactions.push({
      ...input,
      time: sim.getTime(),
    });
  };

  changeMoney = (value: number) => {
    this.money += value;
  };

  addStorage = (commodity: Commodity, quantity: number): number => {
    const surplus = this.storage.addStorage(commodity, quantity);
    this.createOffers();

    return surplus;
  };

  removeStorage = (commodity: Commodity, quantity: number) => {
    this.storage.removeStorage(commodity, quantity);
    this.createOffers();
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

  sim = (delta: number) => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("production")) {
      if (
        every(
          perCommodity((commodity) =>
            this.storage.hasSufficientStorage(
              commodity,
              this.productionAndConsumption[commodity].consumes
            )
          )
        )
      ) {
        this.cooldowns.use("production", 15);
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

    if (this.cooldowns.canUse("shipDispatch")) {
      this.cooldowns.use("shipDispatch", 1);

      const idleShips = this.ships.filter((ship) => ship.idle);
      if (idleShips.length === 0) {
        return;
      }

      const needs = this.getNeededCommodities();

      if (needs.length > 0) {
        const mostNeededCommodity = needs[0];

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
                this.money / this.offers[mostNeededCommodity].price
              ),
              commodity: mostNeededCommodity,
              faction: this.faction,
            },
          });
          return;
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
                this.money / this.offers[mostNeededCommodity].price
              ),
              commodity: mostNeededCommodity,
              faction: this.faction,
            },
          });
        }
      }
    }
  };
}
