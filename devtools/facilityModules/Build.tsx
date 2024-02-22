import React from "react";
import SVG from "react-inlinesvg";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import type { Commodity } from "@core/economy/commodity";
import { commoditiesArray, commodityLabel } from "@core/economy/commodity";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import closeIcon from "@assets/ui/close.svg";
import { IconButton } from "@kit/IconButton";
import {
  Dropdown,
  DropdownButton,
  DropdownOption,
  DropdownOptions,
} from "@kit/Dropdown";
import { formatInt, useThrottledFormState } from "@devtools/utils";
import type { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { max, min } from "@fxts/core";
import { getCommodityCost } from "@core/economy/utils";
import { Table, TableCell, TableHeader } from "../components/Table";
import styles from "./styles.scss";
import type { FormData } from "./utils";

const FacilityModuleBuildEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, setValue } = useFormContext<FormData>();
  const facilityModule = useThrottledFormState<FacilityModuleInput>(
    `facilityModules.${index.toString()}`
  );
  const allModules =
    useThrottledFormState<FacilityModuleInput[]>("facilityModules");
  const [expanded, setExpanded] = React.useState(false);

  if (!facilityModule) {
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
            {...register(`facilityModules.${index}.name`)}
            defaultValue={facilityModule.name}
          />
        </TableCell>
        <TableCell>
          <input
            {...register(`facilityModules.${index}.build.time`, {
              valueAsNumber: true,
              min: 0,
            })}
            type="number"
            defaultValue={facilityModule.build.time}
          />
        </TableCell>
        <TableCell>Expand row to see details</TableCell>
        <TableCell align="right">
          {formatInt(
            Object.entries(facilityModule?.build.cost)
              .filter(([_, cost]) => cost > 0)
              .reduce(
                (acc, [commodity, quantity]) =>
                  acc +
                  getCommodityCost(commodity as Commodity, allModules) *
                    quantity,
                0
              )
          )}
        </TableCell>
        <TableCell align="right">
          {formatInt(
            Object.entries(facilityModule?.build.cost)
              .filter(([_, cost]) => cost > 0)
              .reduce(
                (acc, [commodity, quantity]) =>
                  acc +
                  getCommodityCost(commodity as Commodity, allModules, min) *
                    quantity,
                0
              )
          )}
        </TableCell>
        <TableCell align="right">
          {formatInt(
            Object.entries(facilityModule?.build.cost)
              .filter(([_, cost]) => cost > 0)
              .reduce(
                (acc, [commodity, quantity]) =>
                  acc +
                  getCommodityCost(commodity as Commodity, allModules, max) *
                    quantity,
                0
              )
          )}
        </TableCell>
        <TableCell align="right">
          {formatInt(
            Object.entries(facilityModule?.build.cost)
              .filter(([_, cost]) => cost > 0)
              .reduce((acc, [, quantity]) => acc + quantity, 0)
          )}
        </TableCell>
      </tr>
      {expanded && (
        <tr>
          <TableCell colSpan={3} />
          <TableCell>
            <div className={styles.buildExpanded}>
              {Object.keys(facilityModule.build.cost)
                .filter(
                  (commodity) =>
                    facilityModule.build.cost[commodity] !== undefined
                )
                .map((commodity: Commodity) => (
                  <React.Fragment key={commodity}>
                    <span>{commodityLabel[commodity]}</span>
                    <input
                      {...register(
                        `facilityModules.${index}.build.cost.${commodity}`,
                        {
                          valueAsNumber: true,
                          min: 1,
                        }
                      )}
                      type="number"
                      step={1}
                    />
                    <IconButton
                      onClick={() =>
                        setValue(
                          `facilityModules.${index}.build.cost.${commodity}`,
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
                        facilityModule.build.cost[commodity] === undefined
                    )
                    .map((commodity) => (
                      <DropdownOption
                        onClick={() =>
                          setValue(
                            `facilityModules.${index}.build.cost.${commodity}`,
                            0
                          )
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

export const BuildEditor: React.FC<{
  facilityModules: FacilityModuleInput[];
}> = ({ facilityModules }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "200px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Build [s]</TableHeader>
        <TableHeader>Cost</TableHeader>
        <TableHeader align="right">Average Cost [UTT]</TableHeader>
        <TableHeader align="right">Minimal Cost [UTT]</TableHeader>
        <TableHeader align="right">Maximal Cost [UTT]</TableHeader>
        <TableHeader align="right">Required Storage</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(facilityModules).map((_, facilityModuleIndex) => (
        <FacilityModuleBuildEditor
          index={facilityModuleIndex}
          key={facilityModuleIndex}
        />
      ))}
    </tbody>
  </Table>
);
