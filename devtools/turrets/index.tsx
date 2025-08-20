import React from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import clsx from "clsx";
import turretClasses from "@core/world/data/turrets.json";
import { Button } from "@kit/Button";
import { Table, TableHeader } from "@devtools/components/Table";
import { TableCell } from "@kit/Table";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import { useThrottledFormState } from "@devtools/utils";
import { HexColorPicker } from "react-colorful";
import { Popover } from "@headlessui/react";
import { JSONOutput } from "../components/JSONOutput";
import styles from "./styles.scss";

interface FormData {
  turrets: Array<{
    name: string;
    slug: string;
    damage: number;
    range: number;
    cooldown: number;
    type: string;
    color: string;
  }>;
}

const TurretGeneralEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues, setValue } = useFormContext<FormData>();
  const turret = useThrottledFormState<FormData["turrets"][number]>(
    `turrets.${index.toString()}`
  );

  if (!turret) {
    return null;
  }

  return (
    <tr>
      <TableCell />
      <TableCell>
        <input
          {...register(`turrets.${index}.name`)}
          defaultValue={getValues().turrets[index].name}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`turrets.${index}.slug`)}
          defaultValue={getValues().turrets[index].slug}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`turrets.${index}.damage`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().turrets[index].damage}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`turrets.${index}.range`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().turrets[index].range}
          type="number"
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`turrets.${index}.cooldown`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().turrets[index].cooldown}
          type="number"
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues().turrets[index].type}
          onChange={(value: "laser" | "kinetic") =>
            setValue(`turrets.${index}.type`, value)
          }
        >
          <SelectButton>{getValues().turrets[index].type}</SelectButton>
          <SelectOptions>
            <SelectOption value="laser">Laser</SelectOption>
            <SelectOption value="kinetic">Kinetic</SelectOption>
          </SelectOptions>
        </Select>
      </TableCell>
      <TableCell>
        <Popover>
          <Popover.Button className={styles.color}>
            <div
              className={styles.swatch}
              style={{ backgroundColor: turret.color }}
            />
            {turret.color}
          </Popover.Button>
          <Popover.Panel className={styles.colorPicker}>
            <HexColorPicker
              color={turret.color}
              onChange={(color) => setValue(`turrets.${index}.color`, color)}
            />
          </Popover.Panel>
        </Popover>
      </TableCell>
      <TableCell>{turret.damage / turret.cooldown} DPS</TableCell>
    </tr>
  );
};

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "turrets" });
  const [turrets, setTurrets] = React.useState(getValues().turrets);

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <Button
          color="primary"
          onClick={() => {
            append({
              name: "New Turret",
              slug: "newTurret",
              damage: 1,
              range: 1,
              cooldown: 0,
              type: "kinetic",
              color: "#ffffff",
            });
            setTurrets(getValues().turrets);
          }}
        >
          + Add new turret
        </Button>
      </div>

      <hr className={styles.hr} />

      <Table>
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "250px" }} />
          <col style={{ width: "200px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "150px" }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <th colSpan={2} />
            <TableHeader>Slug</TableHeader>
            <TableHeader>Damage</TableHeader>
            <TableHeader>Range</TableHeader>
            <TableHeader>Cooldown</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Color</TableHeader>
            <TableHeader>DPS</TableHeader>
          </tr>
        </thead>
        <tbody>
          {Object.values(turrets).map((_, turretIndex) => (
            <TurretGeneralEditor index={turretIndex} key={turretIndex} />
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export const Turrets: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: { turrets: turretClasses },
  });
  const [expanded, setExpanded] = React.useState(false);

  return (
    <FormProvider {...form}>
      <div
        className={clsx(styles.root, {
          [styles.rootExpanded]: expanded,
        })}
      >
        <Editor />
        <JSONOutput
          fn={(data) => Object.values(data!)[0]}
          expanded={expanded}
          onExpand={() => setExpanded(!expanded)}
        />
      </div>
    </FormProvider>
  );
};
