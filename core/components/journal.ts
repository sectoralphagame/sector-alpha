import type { Commodity } from "../economy/commodity";
import type { BaseComponent } from "./component";
import type { TradeOfferType } from "./trade";

interface Entry {
  time: number;
}

export interface DestroyEntry extends Entry {
  type: "destroy";
  /**
   * Name of entity
   */
  entity: string;
  sectorId: number;
}

export interface TradeEntry extends Entry {
  type: "trade";
  commodity: Commodity;
  quantity: number;
  /**
   * Name of target object
   *
   * Kept as name because of possible ID dereferencing (such as destroying
   * entity)
   */
  target: string;
  price: number;
  action: TradeOfferType;
}

export interface ShipyardEntry extends Entry {
  type: "shipyard";
  name: string;
  faction: number;
  price: number;
}

export type JournalEntry = TradeEntry | ShipyardEntry | DestroyEntry;

export interface Journal extends BaseComponent<"journal"> {
  entries: JournalEntry[];
}
