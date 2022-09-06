import React from "react";
import { useFormContext } from "react-hook-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "../../ui/components/Collapsible";
import { Input, LabeledInput } from "../../ui/components/Input";
import { ShipInput } from "../../world/ships";
import { styles } from "./styles";
import {
  FormData,
  getShipMiningEfficiency,
  getShipStorageEfficiency,
  getShipTravelSpeed,
  useThrottledFormState,
  withDistance,
} from "./utils";

export const ShipFreightEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);

  if (!ship) {
    return null;
  }

  return (
    <Collapsible>
      <CollapsibleSummary className={styles.editor}>
        <Input
          {...register(`ships.${index}.name`)}
          defaultValue={getValues().ships[index].name}
        />
        <div>{withDistance((d) => getShipTravelSpeed(ship, d).toFixed(2))}</div>
        <div>
          {withDistance((d) => getShipStorageEfficiency(ship, d).toFixed(2))}
        </div>
        <div>
          {withDistance((d) => getShipMiningEfficiency(ship, d).toFixed(2))}
        </div>
      </CollapsibleSummary>
      <CollapsibleContent className={styles.editor}>
        <div />
        <div className={styles.column}>
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
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.storage`, {
              valueAsNumber: true,
            })}
            label="Storage"
            defaultValue={getValues().ships[index].storage}
            type="number"
          />
        </div>
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.mining`, {
              valueAsNumber: true,
            })}
            label="Mining"
            defaultValue={getValues().ships[index].mining}
            type="number"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
