import React from "react";
import { Chart } from "chart.js/auto";
import { map, pipe, range } from "@fxts/core";
import { toArray } from "lodash";
import { getEvasionChance } from "@core/systems/attacking";
import { shipClasses } from "@core/world/ships";

export const EvasionChart: React.FC = () => {
  const chart = React.useRef<Chart | null>(null);
  const [chartContainer, setChartContainer] =
    React.useState<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (chart.current) {
      chart.current.destroy();
    }

    if (chartContainer) {
      const x = pipe(
        range(180),
        map((v) => v / 20),
        toArray
      );

      const minManeuver = Math.min(...shipClasses.map((sc) => sc.maneuver));
      const maxManeuver = Math.max(...shipClasses.map((sc) => sc.maneuver));
      const minCruise = Math.min(...shipClasses.map((sc) => sc.cruise));
      const maxCruise = Math.max(...shipClasses.map((sc) => sc.cruise));

      chart.current = new Chart(chartContainer, {
        type: "line",
        data: {
          labels: x,
          datasets: [
            {
              label: "Evasion chance [%] (small)",
              data: x.map((v) => getEvasionChance(v, "small") * 100),
              borderWidth: 1,
              cubicInterpolationMode: "monotone",
            },
            {
              label: "Evasion chance [%] (medium)",
              data: x.map((v) => getEvasionChance(v, "medium") * 100),
              borderWidth: 1,
              cubicInterpolationMode: "monotone",
            },
            {
              label: "Evasion chance [%] (large)",
              data: x.map((v) => getEvasionChance(v, "large") * 100),
              borderWidth: 1,
              cubicInterpolationMode: "monotone",
            },
            {
              label: "Maneuver",
              fill: "0",
              data: x.map((v) =>
                v < minManeuver || v > maxManeuver ? NaN : 0
              ),
            },
            {
              label: "Cruise",
              fill: "0",
              data: x.map((v) => (v < minCruise || v > maxCruise ? NaN : 0)),
            },
          ],
        },
      });
    }
  }, [chartContainer]);

  return <canvas ref={setChartContainer} />;
};
