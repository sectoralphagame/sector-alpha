import React from "react";
import { useFormContext } from "react-hook-form";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import { useThrottledFormState } from "@devtools/utils";
import { Table, TableCell, TableHeader } from "../components/Table";
import type { FactionInput, FormData } from "./utils";
import styles from "./styles.scss";
import mapData from "../../core/world/data/map.json";

const factionTypeLabels = {
  territorial: "Territorial",
  travelling: "Travelling",
  pirate: "Pirate",
};

const FactionGeneralEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, setValue } = useFormContext<FormData>();
  const faction = useThrottledFormState<FactionInput>(
    `factions.${index.toString()}`
  );

  if (!faction) {
    return null;
  }

  return (
    <tr>
      <TableCell />
      <TableCell>
        <input
          {...register(`factions.${index}.name`)}
          defaultValue={faction.name}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`factions.${index}.slug`)}
          defaultValue={faction.slug}
        />
      </TableCell>
      <TableCell>
        <Select
          value={faction.type}
          onChange={(value) => setValue(`factions.${index}.type`, value)}
        >
          <SelectButton>{factionTypeLabels[faction.type]}</SelectButton>
          <SelectOptions>
            <SelectOption value="territorial">
              {factionTypeLabels.territorial}
            </SelectOption>
            <SelectOption value="travelling">
              {factionTypeLabels.travelling}
            </SelectOption>
            <SelectOption value="pirate">
              {factionTypeLabels.pirate}
            </SelectOption>
          </SelectOptions>
        </Select>
      </TableCell>
      <TableCell align="right">
        <div className={styles.color}>
          <input
            {...register(`factions.${index}.color`)}
            defaultValue={faction.color}
            className={styles.colorInput}
          />
          <span
            className={styles.colorSwatch}
            style={{ background: faction.color }}
          />
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={faction.mining ?? "preferOwn"}
          onChange={(value) => setValue(`factions.${index}.mining`, value)}
        >
          <SelectButton>{faction.mining}</SelectButton>
          <SelectOptions>
            <SelectOption value="preferOwn">preferOwn</SelectOption>
            <SelectOption value="expansive">expansive</SelectOption>
          </SelectOptions>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={faction.home ?? "none"}
          onChange={(value) =>
            setValue(`factions.${index}.home`, value === "none" ? null : value)
          }
        >
          <SelectButton>
            {mapData.sectors.find((sector) => sector.id === faction.home)
              ?.name ?? "None"}
          </SelectButton>
          <SelectOptions>
            {mapData.sectors.map((sector) => (
              <SelectOption value={sector.id}>{sector.name}</SelectOption>
            ))}
            <SelectOption value="none">None</SelectOption>
          </SelectOptions>
        </Select>
      </TableCell>
    </tr>
  );
};

export const GeneralEditor: React.FC<{
  factions: FactionInput[];
}> = ({ factions }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "300px" }} />
      <col style={{ width: "80px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "132px" }} />
      <col style={{ width: "132px" }} />
      <col style={{ width: "180px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Slug</TableHeader>
        <TableHeader>Type</TableHeader>
        <TableHeader align="right">Color</TableHeader>
        <TableHeader>Mining Strategy</TableHeader>
        <TableHeader>Home Sector</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(factions).map((_, factionIndex) => (
        <FactionGeneralEditor index={factionIndex} key={factionIndex} />
      ))}
    </tbody>
  </Table>
);
