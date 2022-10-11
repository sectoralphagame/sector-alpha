import React from "react";
import {
  ColorType,
  createChart,
  IChartApi,
  UTCTimestamp,
} from "lightweight-charts";
import { Sector } from "../../archetypes/sector";
import { getSectorResources } from "../../utils/resources";
import { nano, theme } from "../../style";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Checkbox } from "./Checkbox";

const styles = nano.sheet({
  commodities: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  container: {
    width: "100%",
  },
  label: {
    cursor: "pointer",
    marginLeft: theme.spacing(0.5),
  },
  labelContainer: {
    display: "inline-flex",
    alignItems: "center",
  },
});

const SectorResources: React.FC<{ entity: Sector }> = ({ entity }) => {
  const [open, setOpen] = React.useState(false);
  const chart = React.useRef<IChartApi | null>(null);
  const [chartContainer, setChartContainer] =
    React.useState<HTMLElement | null>(null);
  const availableMineables = React.useMemo(
    () =>
      Object.entries(getSectorResources(entity)).filter(
        ([, { max }]) => max > 0
      ),
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
            color: theme.palette.text(5),
          },
          vertLines: {
            color: theme.palette.text(5),
          },
        },
        layout: {
          background: {
            color: theme.palette.background,
            type: ColorType.Solid,
          },
          textColor: theme.palette.text(3),
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
            color: theme.palette.asteroids[commodity],
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
                {commodity}
              </label>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

export default SectorResources;
