import { Commodity } from "../economy/commodity";
import { perCommodity } from "../utils/perCommodity";
import { Budget } from "./budget";
import { BaseComponent } from "./component";

export interface Transaction extends TradeOffer {
  commodity: Commodity;
  time: number;
}

export interface TransactionInput extends TradeOffer {
  commodity: Commodity;
  factionId: number;
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

export interface Trade extends BaseComponent<"trade"> {
  offers: TradeOffers;
  lastPriceAdjust: { time: number; commodities: Record<Commodity, number> };
  transactions: Transaction[];
}

export function createTrade(): Trade {
  return {
    name: "trade",
    lastPriceAdjust: {
      time: 0,
      commodities: perCommodity(() => 0),
    },
    offers: perCommodity(
      (): TradeOffer => ({
        price: startingPrice,
        quantity: 0,
        type: "sell",
      })
    ),
    transactions: [],
  };
}
