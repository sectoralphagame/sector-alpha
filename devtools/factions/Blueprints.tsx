import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import { useThrottledFormState } from "@devtools/utils";
import SVG from "react-inlinesvg";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import clsx from "clsx";
import { shipClasses } from "@core/world/ships";
import { facilityModules } from "@core/archetypes/facilityModule";
import { IconButton } from "@kit/IconButton";
import { Checkbox } from "@kit/Checkbox";
import Text from "@kit/Text";
import { Table, TableCell, TableHeader } from "../components/Table";
import type { FactionInput, FormData } from "./utils";
import styles from "./styles.scss";

const FactionBlueprintsEditor: React.FC<{ index: number }> = ({ index }) => {
  const { control, register, setValue, getValues } = useFormContext<FormData>();
  const faction = useThrottledFormState<FactionInput>(
    `factions.${index.toString()}`
  );
  const shipsArray = useFieldArray({
    control: control as any,
    name: `factions.${index}.blueprints.ships`,
  });
  const facilityModulesArray = useFieldArray({
    control: control as any,
    name: `factions.${index}.blueprints.facilityModules`,
  });
  const [expanded, setExpanded] = React.useState(false);

  if (!faction) {
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
            {...register(`factions.${index}.name`)}
            defaultValue={faction.name}
          />
        </TableCell>
        <TableCell>
          {faction.blueprints.ships.length} blueprints available
        </TableCell>
        <TableCell>
          {faction.blueprints.facilityModules.length} blueprints available
        </TableCell>
      </tr>
      {expanded && (
        <tr>
          <TableCell colSpan={2} />
          <TableCell>
            {shipClasses.map((sc) => (
              <div className={styles.blueprint} key={sc.slug}>
                <label htmlFor={`bp-${sc.slug}-toggle`}>
                  <Text
                    color={
                      faction.blueprints.ships.includes(sc.slug)
                        ? "default"
                        : "disabled"
                    }
                  >
                    {sc.name}
                  </Text>
                </label>
                <div>
                  <Checkbox
                    id={`bp-${sc.slug}-toggle`}
                    defaultChecked={faction.blueprints.ships.includes(sc.slug)}
                    onChange={() =>
                      faction.blueprints.ships.includes(sc.slug)
                        ? shipsArray.remove(
                            faction.blueprints.ships.indexOf(sc.slug)
                          )
                        : shipsArray.append(sc.slug)
                    }
                  />
                </div>
              </div>
            ))}
          </TableCell>
          <TableCell>
            {Object.values(facilityModules).map((fm) => (
              <div className={styles.blueprint} key={fm.slug}>
                <label htmlFor={`bp-${fm.slug}-toggle`}>
                  <Text
                    color={
                      faction.blueprints.facilityModules.includes(fm.slug)
                        ? "default"
                        : "disabled"
                    }
                  >
                    {fm.name}
                  </Text>
                </label>
                <div>
                  <Checkbox
                    id={`bp-${fm.slug}-toggle`}
                    defaultChecked={faction.blueprints.facilityModules.includes(
                      fm.slug
                    )}
                    onChange={() =>
                      faction.blueprints.facilityModules.includes(fm.slug)
                        ? facilityModulesArray.remove(
                            faction.blueprints.facilityModules.indexOf(fm.slug)
                          )
                        : facilityModulesArray.append(fm.slug)
                    }
                  />
                </div>
              </div>
            ))}
          </TableCell>
        </tr>
      )}
    </>
  );
};

export const BlueprintsEditor: React.FC<{
  factions: FactionInput[];
}> = ({ factions }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "400px" }} />
      <col style={{ width: "400px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Ships</TableHeader>
        <TableHeader>Facility modules</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(factions).map((_, factionIndex) => (
        <FactionBlueprintsEditor index={factionIndex} key={factionIndex} />
      ))}
    </tbody>
  </Table>
);
