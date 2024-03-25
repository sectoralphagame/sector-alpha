import React from "react";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import type { Commodity } from "@core/economy/commodity";
import { commoditiesArray, commodityLabel } from "@core/economy/commodity";
import { IconButton } from "@kit/IconButton";
import {
  Dropdown,
  DropdownButton,
  DropdownOption,
  DropdownOptions,
} from "@kit/Dropdown";
import { formatInt, useThrottledFormState } from "@devtools/utils";
import type {
  FacilityModuleInput,
  HubFacilityModuleInput,
  ProductionFacilityModuleInput,
} from "@core/archetypes/facilityModule";
import { max, min } from "@fxts/core";
import { getCommodityCost } from "@core/economy/utils";
import { ArrowLeftIcon, CloseIcon } from "@assets/ui/icons";
import { Table, TableCell, TableHeader } from "../components/Table";
import styles from "./styles.scss";
import type { FormData } from "./utils";

const FacilityModuleProductionEditor: React.FC<{ index: number }> = ({
  index,
}) => {
  const { register, setValue } = useFormContext<FormData>();
  const facilityModule = useThrottledFormState<FacilityModuleInput>(
    `facilityModules.${index.toString()}`
  );
  const allModules =
    useThrottledFormState<FacilityModuleInput[]>("facilityModules");
  const [expanded, setExpanded] = React.useState(false);

  if (
    !facilityModule ||
    !(facilityModule.type === "production" || facilityModule.type === "hub")
  ) {
    return null;
  }

  const fm = facilityModule as
    | HubFacilityModuleInput
    | ProductionFacilityModuleInput;

  return (
    <>
      <tr>
        <TableCell>
          <IconButton onClick={() => setExpanded(!expanded)}>
            <ArrowLeftIcon
              className={clsx(styles.rowExpander, {
                [styles.rowExpanderToggled]: expanded,
              })}
            />
          </IconButton>
        </TableCell>
        <TableCell>
          <input
            {...register(`facilityModules.${index}.name`)}
            defaultValue={fm.name}
          />
        </TableCell>
        <TableCell colSpan={2}>Expand row to see details</TableCell>
        <TableCell>
          {formatInt(
            Object.entries(facilityModule.pac)
              .filter(([_, pac]) => pac?.produces)
              .reduce(
                (acc, [commodity]) =>
                  acc + getCommodityCost(commodity as Commodity, allModules),
                0
              )
          )}
        </TableCell>
        <TableCell>
          {formatInt(
            Object.entries(facilityModule.pac)
              .filter(([_, pac]) => pac?.produces)
              .reduce(
                (acc, [commodity]) =>
                  acc +
                  getCommodityCost(commodity as Commodity, allModules, min),
                0
              )
          )}
        </TableCell>
        <TableCell>
          {formatInt(
            Object.entries(facilityModule.pac)
              .filter(([_, pac]) => pac?.produces)
              .reduce(
                (acc, [commodity]) =>
                  acc +
                  getCommodityCost(commodity as Commodity, allModules, max),
                0
              )
          )}
        </TableCell>
      </tr>
      {expanded && (
        <tr>
          <TableCell colSpan={2} />
          <TableCell>
            <div className={styles.productionExpanded}>
              {Object.keys(fm.pac)
                .filter((commodity) => fm.pac[commodity] !== undefined)
                .map((commodity: Commodity) => (
                  <React.Fragment key={commodity}>
                    <span>{commodityLabel[commodity]}</span>
                    <input
                      {...register(
                        `facilityModules.${index}.pac.${commodity}.consumes`,
                        {
                          valueAsNumber: true,
                          min: 1,
                        }
                      )}
                      type="number"
                      step={1}
                    />
                    <input
                      {...register(
                        `facilityModules.${index}.pac.${commodity}.produces`,
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
                          `facilityModules.${index}.pac.${commodity}`,
                          undefined
                        )
                      }
                    >
                      <CloseIcon />
                    </IconButton>
                  </React.Fragment>
                ))}
              <Dropdown>
                <DropdownButton>+ Add resource</DropdownButton>
                <DropdownOptions>
                  {commoditiesArray
                    .filter((commodity) => fm.pac[commodity] === undefined)
                    .map((commodity) => (
                      <DropdownOption
                        onClick={() => {
                          setValue(
                            `facilityModules.${index}.pac.${commodity}.consumes`,
                            0
                          );
                          setValue(
                            `facilityModules.${index}.pac.${commodity}.produces`,
                            0
                          );
                        }}
                        key={commodity}
                      >
                        {commodityLabel[commodity]}
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

export const ProductionEditor: React.FC = () => {
  const facilityModules =
    useThrottledFormState<FacilityModuleInput[]>("facilityModules");

  return (
    <Table>
      <colgroup>
        <col style={{ width: "48px" }} />
        <col style={{ width: "250px" }} />
        <col style={{ width: "150px" }} />
        <col style={{ width: "150px" }} />
        <col style={{ width: "150px" }} />
        <col style={{ width: "200px" }} />
        <col style={{ width: "200px" }} />
        <col style={{ width: "200px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
          <th colSpan={2} />
          <TableHeader>Consumption</TableHeader>
          <TableHeader>Production</TableHeader>
          <TableHeader>Crew</TableHeader>
          <TableHeader>Average Cost [UTT]</TableHeader>
          <TableHeader>Minimal Cost [UTT]</TableHeader>
          <TableHeader>Maximal Cost [UTT]</TableHeader>
        </tr>
      </thead>
      <tbody>
        {Object.values(facilityModules).map((_, facilityModuleIndex) => (
          <FacilityModuleProductionEditor
            index={facilityModuleIndex}
            key={facilityModuleIndex}
          />
        ))}
      </tbody>
    </Table>
  );
};
