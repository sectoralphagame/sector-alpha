import React from "react";
import type { IChartApi, UTCTimestamp } from "lightweight-charts";
import { ColorType, createChart } from "lightweight-charts";
import type { Sector } from "@core/archetypes/sector";
import { getSectorResources } from "@core/utils/resources";
import { fieldColors } from "@core/archetypes/asteroid";
import { Button } from "@kit/Button";
import { Dialog } from "@kit/Dialog";
import { Checkbox } from "@kit/Checkbox";
import { commodityLabel } from "@core/economy/commodity";
import styles from "./SectorStats.scss";

const SectorResources: React.FC<{ entity: Sector }> = ({ entity }) => {
  const [open, setOpen] = React.useState(false);
  const chart = React.useRef<IChartApi | null>(null);
  const [chartContainer, setChartContainer] =
    React.useState<HTMLElement | null>(null);
  const availableMineables = React.useMemo(
    () =>
      entity.sim.paths
        ? Object.entries(getSectorResources(entity, 0)).filter(
            ([, { max }]) => max > 0
          )
        : [],
    [entity]
  );
  const [displayedResources, setDisplayedResources] = React.useState(
    availableMineables.map(([commodity]) => commodity)
  );

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
            color: "var(--palette-text-5)",
          },
          vertLines: {
            color: "var(--palette-text-5)",
          },
        },
        layout: {
          background: {
            color: "var(--palette-background)",
            type: ColorType.Solid,
          },
          textColor: "var(--palette-text-3)",
          fontFamily: "Space Mono",
        },
        timeScale: {
          visible: false,
        },
        leftPriceScale: {
          visible: false,
        },
      });

      Object.entries(entity.cp.sectorStats.availableResources)
        .filter(([commodity]) => displayedResources.includes(commodity))
        .forEach(([commodity, values]) => {
          const lineSeries = chart.current!.addLineSeries({
            color: fieldColors[commodity],
            title: commodity,
            priceFormat: {
              type: "custom",
              formatter: (v: number) => v.toFixed(0),
            },
          });
          lineSeries.setData(
            values.map((value, time) => ({ time: time as UTCTimestamp, value }))
          );
        });
    }
  }, [
    chartContainer,
    displayedResources,
    entity,
    entity.cp.sectorStats.availableResources.fuelium.length,
  ]);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>See chart</Button>
      <Dialog open={open} onClose={() => setOpen(false)} width="80vw">
        <div className={styles.container} ref={setChartContainer as any} />
        <div className={styles.commodities}>
          {availableMineables.map(([commodity]) => (
            <div key={commodity} className={styles.labelContainer}>
              <Checkbox
                id={`display-${commodity}-toggle`}
                checked={displayedResources.includes(commodity)}
                onChange={() =>
                  setDisplayedResources((prev) =>
                    prev.includes(commodity)
                      ? prev.filter((c) => c !== commodity)
                      : [...prev, commodity]
                  )
                }
              />
              <label
                className={styles.label}
                htmlFor={`display-${commodity}-toggle`}
              >
                {commodityLabel[commodity]}
              </label>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

export default SectorResources;
