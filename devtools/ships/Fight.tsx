import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ShipInput } from "@core/world/ships";
import { useThrottledFormState } from "@devtools/utils";
import { fromPolar } from "@core/utils/misc";
import { Vec2 } from "ogl";
import { IconButton } from "@kit/IconButton";
import { ArrowLeftIcon, CloseIcon } from "@assets/ui/icons";
import clsx from "clsx";
import { getTurretBySlug, listTurrets } from "@core/world/turrets";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import { Button } from "@kit/Button";
import { AttackingSystem } from "@core/systems/attacking";
import type { FormData } from "./utils";
import { Table, TableCell, TableHeader } from "../components/Table";
import styles from "./styles.scss";

function getDps(ship: ShipInput, direction: Vec2): number {
  let dps = 0;
  for (const turret of ship.turrets) {
    const turretInfo = getTurretBySlug(turret.class);
    const slot = ship.slots.find((s) => s.slug === turret.slot)!;
    if (
      AttackingSystem.isInShootingRange(
        new Vec2(0, 0),
        slot.angle,
        direction,
        turretInfo.range,
        turret.angle
      )
    ) {
      dps += turretInfo.damage / turretInfo.cooldown;
    }
  }

  return dps;
}

const ShipFightEditor: React.FC<{ index: number }> = ({ index }) => {
  const { control, register, getValues, setValue } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);
  const { append, remove } = useFieldArray({
    control,
    name: `ships.${index}.turrets`,
  });
  const [expanded, setExpanded] = React.useState(false);

  if (!ship) {
    return null;
  }

  const availableSlots = ship.slots.filter((slot) =>
    ship.turrets.every((t) => t.slot !== slot.slug)
  );

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
          <input
            {...register(`ships.${index}.hitpoints.hp.value`, {
              valueAsNumber: true,
            })}
            defaultValue={getValues().ships[index].hitpoints?.hp.value}
          />
        </TableCell>
        <TableCell>
          <input
            {...register(`ships.${index}.hitpoints.hp.regen`, {
              valueAsNumber: true,
            })}
            defaultValue={getValues().ships[index].hitpoints?.hp.regen}
          />
        </TableCell>
        <TableCell>
          <input
            {...register(`ships.${index}.hitpoints.shield.value`, {
              valueAsNumber: true,
            })}
            defaultValue={getValues().ships[index].hitpoints?.shield.value}
          />
        </TableCell>
        <TableCell>
          <input
            {...register(`ships.${index}.hitpoints.shield.regen`, {
              valueAsNumber: true,
            })}
            defaultValue={getValues().ships[index].hitpoints?.shield.regen}
          />
        </TableCell>
        <TableCell align="right">
          {getDps(ship, fromPolar(0, 0.5)).toFixed(1)}
        </TableCell>
        <TableCell align="right">
          {getDps(ship, fromPolar(0, -0.5)).toFixed(1)}
        </TableCell>
        <TableCell align="right">
          {getDps(ship, fromPolar(0.5, 0)).toFixed(1)}
        </TableCell>
        <TableCell align="right">
          {getDps(ship, fromPolar(-0.5, 0)).toFixed(1)}
        </TableCell>
      </tr>
      {expanded && (
        <>
          {ship.turrets.map((turret, turretIndex) => (
            <tr key={turret.slot}>
              <TableCell colSpan={2} />
              <TableCell colSpan={2}>
                <Select
                  disabled={availableSlots.length === 0}
                  value={turret.class}
                  onChange={(value) =>
                    setValue(
                      `ships.${index}.turrets.${turretIndex}.slot`,
                      value
                    )
                  }
                >
                  <SelectButton>{turret.slot}</SelectButton>
                  <SelectOptions>
                    {availableSlots.map((slot) => (
                      <SelectOption key={slot.slug} value={slot.slug}>
                        {slot.slug}
                      </SelectOption>
                    ))}
                  </SelectOptions>
                </Select>
              </TableCell>
              <TableCell colSpan={2}>
                <Select
                  value={turret.class}
                  onChange={(value) =>
                    setValue(
                      `ships.${index}.turrets.${turretIndex}.class`,
                      value
                    )
                  }
                >
                  <SelectButton>
                    {getTurretBySlug(ship.turrets[turretIndex].class).name}
                  </SelectButton>
                  <SelectOptions>
                    {listTurrets().map((turretClass) => (
                      <SelectOption
                        key={turretClass.slug}
                        value={turretClass.slug}
                      >
                        {turretClass.name}
                      </SelectOption>
                    ))}
                  </SelectOptions>
                </Select>
              </TableCell>
              <TableCell>Angle</TableCell>
              <TableCell>
                <IconButton variant="naked" onClick={() => remove(turretIndex)}>
                  <CloseIcon />
                </IconButton>
              </TableCell>
            </tr>
          ))}
          {availableSlots.length > 0 && (
            <tr>
              <TableCell colSpan={2} />
              <TableCell>
                <Button
                  onClick={() =>
                    append({
                      angle: 0,
                      class: listTurrets()[0].slug,
                      slot: availableSlots[0].slug,
                    })
                  }
                >
                  + Add turret
                </Button>
              </TableCell>
            </tr>
          )}
        </>
      )}
    </>
  );
};

export const FightEditor: React.FC<{ ships: ShipInput[] }> = ({ ships }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "110px" }} />
      <col style={{ width: "110px" }} />
      <col style={{ width: "110px" }} />
      <col style={{ width: "110px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>HP Max</TableHeader>
        <TableHeader>Regen</TableHeader>
        <TableHeader>Shield Max</TableHeader>
        <TableHeader>Regen</TableHeader>
        <TableHeader align="right">DPS (Front)</TableHeader>
        <TableHeader align="right">DPS (Back)</TableHeader>
        <TableHeader align="right">DPS (Left)</TableHeader>
        <TableHeader align="right">DPS (Right)</TableHeader>
      </tr>
    </thead>
    <tbody>
      {ships.map((_, shipIndex) => (
        <ShipFightEditor index={shipIndex} key={shipIndex} />
      ))}
    </tbody>
  </Table>
);
