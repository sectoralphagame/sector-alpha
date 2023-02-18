import { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { Commodity } from "@core/economy/commodity";
import { discriminate } from "@core/utils/maps";
import { average, filter, map, pipe, sum } from "@fxts/core";
import throttle from "lodash/throttle";
import { useCallback, useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

export function useThrottledFormState<T>(name?: string): T {
  const data: T = useWatch(name ? { name } : undefined!);
  const [display, setDisplay] = useState<T>(data);
  const refreshDisplay = useCallback(throttle(setDisplay, 500), []);

  useEffect(() => {
    refreshDisplay(data);
  }, [data]);

  return display!;
}

export function getCost(
  commodity: Commodity,
  facilityModules: FacilityModuleInput[],
  fn: (_it: Iterable<number>) => number = average
): number {
  const productionModules = facilityModules.filter(
    discriminate("type", "production")
  );

  if (!productionModules.find((fm) => fm.pac[commodity]?.produces)) {
    const x3 = (v: number) => [v, v * 3];
    return fn(
      {
        ice: x3(9),
        ore: x3(14),
        silica: x3(17),
        fuelium: x3(25),
        goldOre: x3(32),
      }[commodity]
    );
  }

  return pipe(
    productionModules,
    filter((fm) => fm.pac[commodity]?.produces),
    map((fm) =>
      pipe(
        Object.entries(fm.pac),
        filter(([_, pac]) => pac.consumes),
        map(
          ([consumedCommodity, { consumes }]) =>
            (getCost(consumedCommodity as Commodity, productionModules, fn) *
              consumes) /
            fm.pac[commodity]!.produces
        ),
        sum
      )
    ),
    fn
  );
}

export const formatInt = Intl.NumberFormat(window.navigator.language, {
  maximumFractionDigits: 0,
  compactDisplay: "short",
}).format;
