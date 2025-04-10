import React from "react";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import type { ShipInput } from "@core/world/ships";
import { LabeledInput } from "@kit/Input";
import { IconButton } from "@kit/IconButton";
import { Card, CardHeader } from "@kit/Card";
import { useThrottledFormState } from "@devtools/utils";
import { ArrowLeftIcon } from "@assets/ui/icons";
import { formatSI } from "@core/utils/format";
import { Table, TableCell, TableHeader } from "../components/Table";
import styles from "./styles.scss";
import type { FormData } from "./utils";
import {
  getShipMiningEfficiency,
  getShipStorageEfficiency,
  getShipTravelSpeed,
  withDistance,
} from "./utils";

const ShipFreightEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues } = useFormContext<FormData>();
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
            <ArrowLeftIcon
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
          {withDistance((d) => formatSI(getShipTravelSpeed(ship, d), "", 2))}
        </TableCell>
        <TableCell>
          {withDistance((d) =>
            formatSI(getShipStorageEfficiency(ship, d), "", 2)
          )}
        </TableCell>
        <TableCell className={ship.mining ? "" : styles.dimmed}>
          {withDistance((d) =>
            formatSI(getShipMiningEfficiency(ship, d), "", 2)
          )}
        </TableCell>
      </tr>
      {expanded && (
        <tr>
          <TableCell />
          <TableCell colSpan={4}>
            <div className={styles.freightExpanded}>
              <Card>
                <CardHeader>Drive</CardHeader>
                <div className={styles.freightExpandedForm}>
                  <LabeledInput
                    {...register(`ships.${index}.acceleration`, {
                      valueAsNumber: true,
                    })}
                    label="Acceleration"
                    defaultValue={getValues().ships[index].acceleration}
                    type="number"
                    max={1}
                    min={0.01}
                    step={0.01}
                  />
                  <LabeledInput
                    {...register(`ships.${index}.cruise`, {
                      valueAsNumber: true,
                    })}
                    label="Cruise"
                    defaultValue={getValues().ships[index].cruise}
                    type="number"
                  />
                  <LabeledInput
                    {...register(`ships.${index}.maneuver`, {
                      valueAsNumber: true,
                    })}
                    label="Maneuver"
                    defaultValue={getValues().ships[index].maneuver}
                    type="number"
                  />
                  <LabeledInput
                    {...register(`ships.${index}.rotary`, {
                      valueAsNumber: true,
                    })}
                    label="Rotary"
                    defaultValue={getValues().ships[index].rotary}
                    type="number"
                  />
                  <LabeledInput
                    {...register(`ships.${index}.ttc`, { valueAsNumber: true })}
                    label="Time to cruise"
                    defaultValue={getValues().ships[index].ttc}
                    type="number"
                  />
                </div>
              </Card>
              <Card>
                <CardHeader>Miscellaneous</CardHeader>
                <div className={styles.freightExpandedForm}>
                  <LabeledInput
                    {...register(`ships.${index}.storage`, {
                      valueAsNumber: true,
                    })}
                    label="Storage"
                    defaultValue={getValues().ships[index].storage}
                    type="number"
                  />
                  <LabeledInput
                    {...register(`ships.${index}.mining`, {
                      valueAsNumber: true,
                    })}
                    label="Mining"
                    defaultValue={getValues().ships[index].mining}
                    type="number"
                  />
                </div>
              </Card>
            </div>
          </TableCell>
        </tr>
      )}
    </>
  );
};

export const FreightEditor: React.FC<{ ships: ShipInput[] }> = ({ ships }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "350px" }} />
      <col style={{ width: "350px" }} />
      <col style={{ width: "350px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Speed [su/s]</TableHeader>
        <TableHeader>Storage [units/month]</TableHeader>
        <TableHeader>Mining [units/month]</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(ships).map((_, shipIndex) => (
        <ShipFreightEditor index={shipIndex} key={shipIndex} />
      ))}
    </tbody>
  </Table>
);
