import React from "react";
import { useFormContext } from "react-hook-form";
import { ShipInput } from "../../world/ships";
import { Input, LabeledInput } from "../../ui/components/Input";
import { FormData, useThrottledFormState } from "./utils";
import { styles } from "./styles";

export const ShipGeneralEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);

  if (!ship) {
    return null;
  }

  return (
    <div className={styles.editor}>
      <Input
        {...register(`ships.${index}.name`)}
        defaultValue={getValues().ships[index].name}
      />
      <LabeledInput
        {...register(`ships.${index}.texture`)}
        label="Texture"
        defaultValue={getValues().ships[index].texture}
      />
      <LabeledInput
        {...register(`ships.${index}.size`)}
        label="Size"
        defaultValue={getValues().ships[index].size}
      />
    </div>
  );
};
