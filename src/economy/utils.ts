import { TradeOffer } from "./factility";

export function isSellOffer(offer: TradeOffer): boolean {
  return offer.quantity > 0;
}
