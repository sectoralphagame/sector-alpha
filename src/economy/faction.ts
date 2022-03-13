import Color from "color";
import { Cooldowns } from "../utils/cooldowns";
import { Facility } from "./factility";

export class Faction {
  slug: string;
  name: string;
  money: number;
  cooldowns: Cooldowns<"adjustPrices">;
  facilities: Facility[];
  color: string;

  constructor(slug: string) {
    this.slug = slug;
    this.facilities = [];
    this.cooldowns = new Cooldowns("adjustPrices");
    this.color = Color.rgb(151, 255, 125)
      .rotate(Math.random() * 360)
      .toString();
  }

  changeMoney = (value: number) => {
    this.money += value;
  };

  addFacility = (facility: Facility) => {
    this.facilities.push(facility);
    facility.faction = this;
  };

  sim = (delta: number) => {
    this.facilities.forEach((facility) => facility.sim(delta));
    if (this.cooldowns.canUse("adjustPrices")) {
      this.cooldowns.use("adjustPrices", 60);
      this.facilities.forEach((facility) => facility.adjustPrices());
    }

    this.cooldowns.update(delta);
  };
}
