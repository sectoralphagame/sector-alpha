import { Cooldowns } from "../utils/cooldowns";
import { Facility } from "./factility";

export class Faction {
  slug: string;
  name: string;
  money: number;
  cooldowns: Cooldowns<"adjustPrices">;
  facilities: Facility[];

  constructor(slug: string) {
    this.slug = slug;
    this.facilities = [];
    this.cooldowns = new Cooldowns("adjustPrices");
  }

  changeMoney = (value: number) => {
    this.money += value;
  };

  sim = (delta: number) => {
    this.facilities.forEach((facility) => facility.sim(delta));
    if (this.cooldowns.canUse("adjustPrices")) {
      this.cooldowns.use("adjustPrices", 60_000);
      this.facilities.forEach((facility) => facility.adjustPrices());
    }

    this.cooldowns.update(delta);
  };
}
