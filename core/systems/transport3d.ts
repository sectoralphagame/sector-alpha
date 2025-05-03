import type { RequirePureComponent } from "@core/tsHelpers";
import { Observable } from "@core/utils/observer";

export class Transport3D {
  hooks: {
    shoot: Observable<RequirePureComponent<"position" | "damage">>;
    explode: Observable<RequirePureComponent<"position">>;
    deployFacility: Observable<RequirePureComponent<"position">>;
    startMining: Observable<RequirePureComponent<"position">>;
    stopMining: Observable<RequirePureComponent<"position">>;
  };

  constructor() {
    this.hooks = {
      shoot: new Observable("shoot"),
      explode: new Observable("explode"),
      deployFacility: new Observable("deployFacility"),
      startMining: new Observable("startMining"),
      stopMining: new Observable("stopMining"),
    };
  }

  reset() {
    for (const key of Object.keys(this.hooks)) {
      this.hooks[key].reset();
    }
  }
}

export const transport3D = new Transport3D();
