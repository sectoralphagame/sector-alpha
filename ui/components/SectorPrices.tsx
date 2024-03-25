import React from "react";
import type { IChartApi, UTCTimestamp } from "lightweight-charts";
import { ColorType, createChart } from "lightweight-charts";
import Color from "color";
import type { Sector } from "@core/archetypes/sector";
import { Button } from "@kit/Button";
import { Dialog } from "@kit/Dialog";
import { Checkbox } from "@kit/Checkbox";
import { useLocalStorage } from "@ui/hooks/useLocalStorage";
import { commodityLabel } from "@core/economy/commodity";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { Table, TableCell } from "@kit/Table";
import clsx from "clsx";
import { CloseIcon, OKIcon } from "@assets/ui/icons";
import styles from "./SectorPrices.scss";

const baseColor = Color.rgb(151, 255, 125);

const SectorPrices: React.FC<{ entity: Sector }> = ({ entity }) => {
  const [open, setOpen] = React.useState(false);
  const chart = React.useRef<IChartApi | null>(null);
  const [chartContainer, setChartContainer] =
    React.useState<HTMLElement | null>(null);
  const availableCommodities = React.useMemo(
    () =>
      Object.entries(entity.cp.sectorStats.prices)
        .filter(
          ([, offers]) =>
            offers.buy.some((v) => v > 0) || offers.sell.some((v) => v > 0)
        )
        .map(([commodity, offers]) => ({
          commodity,
          buy: offers.buy.some((v) => v > 0),
          sell: offers.sell.some((v) => v > 0),
        }))
        .filter(({ commodity }) => commodity !== "tauMetal"),
    [entity.cp.sectorStats.prices.fuelium.buy.length, entity]
  );
  const [displayedResources, setDisplayedResources] = useLocalStorage(
    "SectorPricesDisplayedResources",
    ["food", "fuel"] as string[]
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
            color: "black",
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
    <>
      <Collapsible defaultOpen>
        <CollapsibleSummary className={styles.header}>
          Available Wares
        </CollapsibleSummary>
        <CollapsibleContent className={styles.collapsible}>
          <Table>
            <thead>
              <th>Name</th>
              <th align="right">Buy</th>
              <th align="right">Sell</th>
            </thead>
            <tbody>
              {availableCommodities.map(({ commodity, buy, sell }) => (
                <tr key={commodity}>
                  <TableCell>{commodityLabel[commodity]}</TableCell>
                  <TableCell align="right">
                    {buy ? (
                      <OKIcon
                        className={clsx(styles.icon, styles.iconSuccess)}
                      />
                    ) : (
                      <CloseIcon
                        className={clsx(styles.icon, styles.iconError)}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {sell ? (
                      <OKIcon
                        className={clsx(styles.icon, styles.iconSuccess)}
                      />
                    ) : (
                      <CloseIcon
                        className={clsx(styles.icon, styles.iconError)}
                      />
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button onClick={() => setOpen(true)}>See pricing history</Button>
        </CollapsibleContent>
      </Collapsible>
      <Dialog open={open} onClose={() => setOpen(false)} width="80vw">
        <div className={styles.container} ref={setChartContainer as any} />
        <div className={styles.commodities}>
          {availableCommodities.map(({ commodity }) => (
            <div key={commodity} className={styles.labelContainer}>
              <Checkbox
                id={`display-${commodity}-toggle`}
                checked={displayedResources.includes(commodity)}
                onChange={() =>
                  setDisplayedResources(
                    displayedResources.includes(commodity)
                      ? displayedResources.filter((c) => c !== commodity)
                      : [...displayedResources, commodity]
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
    </>
  );
};

export default SectorPrices;
