import Color from "color";
import { Budget, createBudget } from "../components/budget";

let factionCounter = 0;

export class Faction {
  slug: string;
  name: string;
  color: string;
  budget: Budget;

  constructor(slug: string) {
    this.slug = slug;
    this.color = Color.rgb(151, 255, 125)
      .rotate((factionCounter * 360) / 8)
      .toString();
    this.budget = createBudget();
    factionCounter += 1;
  }
}
