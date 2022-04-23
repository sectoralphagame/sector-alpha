import Color from "color";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";
import { Budget } from "./budget";
import { Facility } from "./factility";

let factionCounter = 0;

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
      .rotate((Math.random() + factionCounter) * 70)
      .toString();
    this.budget = new Budget();
    factionCounter += 1;
  }

  addFacility = (facility: Facility) => {
    this.facilities.push(facility);
    facility.setOwner(this);
  };

  sim = (delta: number) => {
    this.facilities.forEach((facility) => facility.simulate(delta));

    if (this.cooldowns.canUse("budget")) {
      this.cooldowns.use("budget", 60);
      this.facilities.forEach((facility) => {
        const budgetChange =
          facility.getPlannedBudget() - facility.budget.getAvailableMoney();

        if (budgetChange < 0) {
          facility.budget.transferMoney(
            limitMax(-budgetChange, facility.budget.getAvailableMoney()),
            this.budget
          );
        } else {
          this.budget.transferMoney(
            limitMax(budgetChange, this.budget.getAvailableMoney()),
            facility.budget
          );
        }
      });
    }

    this.cooldowns.update(delta);
  };
}
