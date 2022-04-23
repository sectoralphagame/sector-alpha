import { Commodity } from "../economy/commodity";
import { perCommodity } from "../utils/perCommodity";

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
