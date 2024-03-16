import type { Sim } from "@core/sim";
import { setCheat } from "@core/utils/misc";
import { System } from "../system";

export class AvgFrameReportingSystem extends System {
  start = 0;
  iterations = 0;
  accumulator = 0;
  reporting = true;

  apply(sim: Sim): void {
    super.apply(sim);

    setCheat("toggleAvgFrameReporting", () => {
      this.reporting = !this.reporting;
    });

    sim.hooks.phase.start.tap(this.constructor.name, () => {
      this.start = performance.now();
    });

    sim.hooks.phase.end.tap(this.constructor.name, (delta) => {
      if (!this.reporting || delta === 0) return;

      this.accumulator += performance.now() - this.start;
      this.iterations++;

      if (this.iterations === 60) {
        // eslint-disable-next-line no-console
        console.log("Avg frame time: ", (this.accumulator / 60).toFixed(2));
        this.iterations = 0;
        this.accumulator = 0;
      }
    });
  }
}
