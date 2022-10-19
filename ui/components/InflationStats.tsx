import React from "react";
import {
  ColorType,
  createChart,
  IChartApi,
  UTCTimestamp,
} from "lightweight-charts";
import { Sim } from "@core/sim";
import { Button } from "@kit/Button";
import { Dialog } from "@kit/Dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { getVar } from "@kit/theming/style";
import styles from "./InflationStats.scss";

const Inflation: React.FC<{ sim: Sim }> = ({ sim }) => {
  const [open, setOpen] = React.useState(false);
  const settings = React.useRef(sim.queries.settings.get()[0]);
  const chart = React.useRef<IChartApi | null>(null);
  const [chartContainer, setChartContainer] =
    React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (chart.current) {
      chart.current.remove();
    }

    if (chartContainer) {
      chart.current = createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: Math.min(chartContainer.clientWidth, window.innerHeight / 2),
        handleScroll: {
          mouseWheel: false,
        },
        grid: {
          horzLines: {
            color: getVar("--palette-text-5"),
          },
          vertLines: {
            color: getVar("--palette-text-5"),
          },
        },
        layout: {
          background: {
            color: "black",
            type: ColorType.Solid,
          },
          textColor: getVar("--palette-text-3"),
          fontFamily: "Space Mono",
        },
        timeScale: {
          visible: false,
        },
        leftPriceScale: {
          visible: false,
        },
      });

      const lineSeries = chart.current!.addLineSeries({
        color: getVar("--palette-default"),
        title: "Inflation (10 minute period)",
        priceFormat: {
          type: "custom",
          formatter: (v: number) => `${((v - 1) * 100).toFixed(1)}%`,
        },
      });
      lineSeries.setData(
        settings.current.cp.inflationStats.basketPrices
          .slice(1)
          .map((value, time) => ({
            time: time as UTCTimestamp,
            value: value / settings.current.cp.inflationStats.basketPrices[0],
          }))
      );
    }
  }, [
    chartContainer,
    sim,
    sim.queries.settings.get()[0].cp.systemManager.lastInflationStatUpdate,
  ]);

  return (
    <>
      <Collapsible>
        <CollapsibleSummary>Inflation</CollapsibleSummary>
        <CollapsibleContent>
          <div>
            Current inflation:{" "}
            {(
              (settings.current.cp.inflationStats.basketPrices.at(-1)! /
                settings.current.cp.inflationStats.basketPrices[0] -
                1) *
              100
            ).toFixed(1)}
            %
          </div>
          <Button className={styles.button} onClick={() => setOpen(true)}>
            See chart
          </Button>
        </CollapsibleContent>
      </Collapsible>
      <Dialog open={open} onClose={() => setOpen(false)} width="80vw">
        <div className={styles.container} ref={setChartContainer as any} />
      </Dialog>
    </>
  );
};

export default Inflation;
