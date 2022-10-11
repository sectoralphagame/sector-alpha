import { random, randomInt } from "mathjs";
import { Commodity } from "../economy/commodity";
import { perCommodity } from "../utils/perCommodity";
import { BaseComponent } from "./component";

export type PriceBelief = [number, number];

export interface TransactionInput extends Omit<TradeOffer, "active"> {
  commodity: Commodity;
  /**
   * ID of entity that initiates trade (usually ship)
   */
  initiator: number;
  factionId: number;
  /**
   *  ID of entity with budget
   * */
  budget: number | null;
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
  active: boolean;
  price: number;
  quantity: number;
  type: TradeOfferType;
}

export type TradeOffers = Record<Commodity, TradeOffer>;

export interface Trade extends BaseComponent<"trade"> {
  pricing: Record<Commodity, PriceBelief>;
  offers: TradeOffers;
  lastPriceAdjust: { time: number; commodities: Record<Commodity, number> };
}

export function createTrade(): Trade {
  const pricing = perCommodity(() => {
    const lower = random(50, 150);
    const upper = lower + random(5, 20);

    return [lower, upper] as PriceBelief;
  });

  return {
    name: "trade",
    pricing,
    lastPriceAdjust: {
      time: 0,
      commodities: perCommodity(() => 0),
    },
    offers: perCommodity(
      (commodity): TradeOffer => ({
        active: false,
        price: randomInt(...pricing[commodity]),
        quantity: 0,
        type: "sell",
      })
    ),
  };
}
