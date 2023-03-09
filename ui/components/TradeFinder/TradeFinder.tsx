import type { Commodity } from "@core/economy/commodity";
import { commoditiesArray, commodityLabel } from "@core/economy/commodity";
import {
  Dropdown,
  DropdownButton,
  DropdownOption,
  DropdownOptions,
} from "@kit/Dropdown";
import { IconButton } from "@kit/IconButton";
import React from "react";
import SVG from "react-inlinesvg";
import locationIcon from "@assets/ui/location.svg";
import { useLocalStorage } from "@ui/hooks/useLocalStorage";
import sortBy from "lodash/sortBy";
import clsx from "clsx";
import { useSim } from "../../atoms";
import styles from "./TradeFinder.scss";

export const TradeFinder: React.FC = () => {
  const [sim] = useSim();
  const [selectedCommodity, setSelectedCommodity] = useLocalStorage<Commodity>(
    "TradeFinder",
    "fuel"
  );

  return (
    <>
      <Dropdown>
        <DropdownButton>
          {selectedCommodity
            ? commodityLabel[selectedCommodity]
            : "Find resource..."}
        </DropdownButton>
        <DropdownOptions>
          {commoditiesArray.map((commodity) => (
            <DropdownOption
              key={commodity}
              onClick={() => setSelectedCommodity(commodity)}
            >
              {commodityLabel[commodity]}
            </DropdownOption>
          ))}
        </DropdownOptions>
      </Dropdown>
      <div className={styles.facilities}>
        {sortBy(
          sim.queries.trading
            .get()
            .filter((entity) =>
              selectedCommodity
                ? entity.cp.trade.offers[selectedCommodity].active &&
                  entity.cp.trade.offers[selectedCommodity].quantity > 0
                : true
            ),
          `components.trade.offers.${selectedCommodity}.price`
        ).map((entity) => (
          <div className={styles.facilitiesItem} key={entity.id}>
            <span>{entity.cp.name!.value}</span>
            <span
              className={clsx(
                styles.facilitiesItemPrice,
                entity.cp.trade.offers[selectedCommodity].type === "buy"
                  ? styles.facilitiesItemPriceBuy
                  : styles.facilitiesItemPriceSell
              )}
            >
              {entity.cp.trade.offers[selectedCommodity].price} UTT
            </span>
            <IconButton
              variant="naked"
              onClick={() => {
                sim.queries.settings.get()[0].cp.selectionManager.id =
                  entity.id;
              }}
            >
              <SVG src={locationIcon} />
            </IconButton>
          </div>
        ))}
      </div>
    </>
  );
};

TradeFinder.displayName = "TradeFinder";
