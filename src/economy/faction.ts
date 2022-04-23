import Color from "color";
import { Cooldowns } from "../utils/cooldowns";
import { Budget } from "./budget";

let factionCounter = 0;

export class Faction {
  slug: string;
  name: string;
  cooldowns: Cooldowns<"adjustPrices" | "budget">;
  color: string;
  budget: Budget;

  constructor(slug: string) {
    this.slug = slug;
    this.color = Color.rgb(151, 255, 125)
      .rotate((Math.random() + factionCounter) * 70)
      .toString();
    this.budget = new Budget();
    factionCounter += 1;
  }
}
