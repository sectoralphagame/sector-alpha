import React from "react";
import {
  ColorType,
  createChart,
  IChartApi,
  UTCTimestamp,
} from "lightweight-charts";
import Color from "color";
import { Sector } from "../../archetypes/sector";
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
  header: {
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
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

const baseColor = Color.rgb(151, 255, 125);

const SectorPrices: React.FC<{ entity: Sector }> = ({ entity }) => {
  const [open, setOpen] = React.useState(false);
  const chart = React.useRef<IChartApi | null>(null);
  const [chartContainer, setChartContainer] =
    React.useState<HTMLElement | null>(null);
  const availableCommodities = React.useMemo(
    () =>
      Object.entries(entity.cp.sectorStats.prices)
        .filter(([, offers]) => offers.buy || offers.sell)
        .map(([commodity]) => commodity),
    [entity.cp.sectorStats.prices.fuelium.buy.length]
  );
  const [displayedResources, setDisplayedResources] = React.useState(
    availableCommodities.slice(0, 2)
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
            color: "black",
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

      Object.entries(entity.cp.sectorStats.prices)
        .filter(([commodity]) => displayedResources.includes(commodity))
        .forEach(([commodity, values], index, arr) => {
          const buyLineSeries = chart.current!.addLineSeries({
            color: baseColor.rotate((index * 360) / arr.length).hex(),
            title: `${commodity} - buy`,
            priceFormat: {
              type: "custom",
              formatter: (v: number) => v.toFixed(0),
            },
          });
          buyLineSeries.setData(
            values.buy.map((value, time) => ({
              time: time as UTCTimestamp,
              value,
            }))
          );

          const sellLineSeries = chart.current!.addLineSeries({
            color: baseColor
              .rotate((index * 360) / arr.length)
              .lighten(0.25)
              .hex(),
            title: `${commodity} - sell`,
            priceFormat: {
              type: "custom",
              formatter: (v: number) => v.toFixed(0),
            },
          });
          sellLineSeries.setData(
            values.sell.map((value, time) => ({
              time: time as UTCTimestamp,
              value,
            }))
          );
        });
    }
  }, [
    chartContainer,
    displayedResources,
    entity,
    entity.cp.sectorStats.prices.fuelium.buy.length,
  ]);

  return (
    <div>
      <div className={styles.header}>Pricing history</div>
      <Button onClick={() => setOpen(true)}>See chart</Button>
      <Dialog open={open} onClose={() => setOpen(false)} width="80vw">
        <div className={styles.container} ref={setChartContainer as any} />
        <div className={styles.commodities}>
          {availableCommodities.map((commodity) => (
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

export default SectorPrices;
