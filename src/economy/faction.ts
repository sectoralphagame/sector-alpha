import Color from "color";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";
import { Budget } from "./budget";
import { Facility } from "./factility";

export class Faction {
  slug: string;
  name: string;
  cooldowns: Cooldowns<"adjustPrices" | "budget">;
  facilities: Facility[];
  color: string;
  budget: Budget;

  constructor(slug: string) {
    this.slug = slug;
    this.facilities = [];
    this.cooldowns = new Cooldowns("adjustPrices", "budget");
    this.color = Color.rgb(151, 255, 125)
      .rotate(Math.random() * 360)
      .toString();
    this.budget = new Budget();
  }

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

    if (this.cooldowns.canUse("budget")) {
      this.cooldowns.use("budget", 60);
      this.facilities.forEach((facility) => {
        const budgetChange =
          facility.getPlannedBudget() - facility.budget.money;

        if (budgetChange < 0) {
          facility.budget.transferMoney(
            limitMax(-budgetChange, facility.budget.money),
            this.budget
          );
        } else {
          this.budget.transferMoney(
            limitMax(budgetChange, this.budget.money),
            facility.budget
          );
        }
      });
    }

    this.cooldowns.update(delta);
  };
}
