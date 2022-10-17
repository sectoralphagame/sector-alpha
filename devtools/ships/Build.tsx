import React from "react";
import SVG from "react-inlinesvg";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import { ShipInput } from "@core/world/ships";
import { commoditiesArray, Commodity } from "@core/economy/commodity";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import closeIcon from "@assets/ui/close.svg";
import { IconButton } from "@kit/IconButton";
import {
  Dropdown,
  DropdownButton,
  DropdownOption,
  DropdownOptions,
} from "@kit/Dropdown";
import { Table, TableCell, TableHeader } from "../components/Table";
import styles from "./styles.scss";
import { FormData, useThrottledFormState } from "./utils";

const ShipBuildEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues, setValue } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);
  const [expanded, setExpanded] = React.useState(false);

  if (!ship) {
    return null;
  }

  return (
    <>
      <tr>
        <TableCell>
          <IconButton onClick={() => setExpanded(!expanded)}>
            <SVG
              src={arrowLeftIcon}
              className={clsx(styles.rowExpander, {
                [styles.rowExpanderToggled]: expanded,
              })}
            />
          </IconButton>
        </TableCell>
        <TableCell>
          <input
            {...register(`ships.${index}.name`)}
            defaultValue={getValues().ships[index].name}
          />
        </TableCell>
        <TableCell>
          <input
            {...register(`ships.${index}.build.time`, {
              valueAsNumber: true,
              min: 0,
            })}
            defaultValue={getValues().ships[index].build.time}
          />
        </TableCell>
        <TableCell>Expand row to see details</TableCell>
      </tr>
      {expanded && (
        <tr>
          <TableCell colSpan={3} />
          <TableCell>
            <div className={styles.buildExpanded}>
              {Object.keys(getValues().ships[index].build.cost)
                .filter(
                  (commodity) =>
                    getValues().ships[index].build.cost[commodity] !== undefined
                )
                .map((commodity: Commodity) => (
                  <React.Fragment key={commodity}>
                    <span>{commodity}</span>
                    <input
                      {...register(`ships.${index}.build.cost.${commodity}`, {
                        valueAsNumber: true,
                        min: 1,
                      })}
                      step={1}
                    />
                    <IconButton
                      onClick={() =>
                        setValue(
                          `ships.${index}.build.cost.${commodity}`,
                          undefined
                        )
                      }
                    >
                      <SVG src={closeIcon} />
                    </IconButton>
                  </React.Fragment>
                ))}
              <Dropdown>
                <DropdownButton>+ Add resource</DropdownButton>
                <DropdownOptions>
                  {commoditiesArray
                    .filter(
                      (commodity) =>
                        getValues().ships[index].build.cost[commodity] ===
                        undefined
                    )
                    .map((commodity) => (
                      <DropdownOption
                        onClick={() =>
                          setValue(`ships.${index}.build.cost.${commodity}`, 0)
                        }
                        key={commodity}
                      >
                        {commodity}
                      </DropdownOption>
                    ))}
                </DropdownOptions>
              </Dropdown>
            </div>
          </TableCell>
        </tr>
      )}
    </>
  );
};

export const BuildEditor: React.FC<{ ships: ShipInput[] }> = ({ ships }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "150px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Buikd [s]</TableHeader>
        <TableHeader>Cost</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(ships).map((_, shipIndex) => (
        <ShipBuildEditor index={shipIndex} key={shipIndex} />
      ))}
    </tbody>
  </Table>
);
