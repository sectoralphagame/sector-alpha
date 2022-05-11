import { Commodity } from "../economy/commodity";
import { Faction } from "../economy/faction";
import { perCommodity } from "../utils/perCommodity";
import { Budget } from "./budget";

export interface Transaction extends TradeOffer {
  commodity: Commodity;
  time: number;
}

export interface TransactionInput extends TradeOffer {
  commodity: Commodity;
  faction: Faction;
  budget: Budget | null;
  allocations: Record<
    "buyer" | "seller",
    {
      budget: number | null;
      storage: number | null;
    } | null
  > | null;
}

export type TradeOfferType = "buy" | "sell";

export interface TradeOffer {
  price: number;
  quantity: number;
  type: TradeOfferType;
}

export type TradeOffers = Record<Commodity, TradeOffer>;

export const startingPrice = 100;

export class Trade {
  offers: TradeOffers;
  lastPriceAdjust = {
    time: 0,
    commodities: perCommodity(() => 0),
  };
  transactions: Transaction[] = [];

  constructor() {
    this.offers = perCommodity(
      (): TradeOffer => ({
        price: startingPrice,
        quantity: 0,
        type: "sell",
      })
    );
  }
}
