import React from "react";
import SVG from "react-inlinesvg";
import { useFormContext } from "react-hook-form";
import { ShipInput, shipRoles } from "@core/world/ships";
import { Textures, textures } from "@core/components/render";
import { DockSize } from "@core/components/dockable";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import { Table, TableCell, TableHeader } from "../components/Table";
import styles from "./styles.scss";
import { FormData, useThrottledFormState } from "./utils";

const ShipGeneralEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues, setValue } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);

  if (!ship) {
    return null;
  }

  return (
    <tr>
      <TableCell />
      <TableCell>
        <input
          {...register(`ships.${index}.name`)}
          defaultValue={getValues().ships[index].name}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.slug`)}
          defaultValue={getValues().ships[index].slug}
        />
      </TableCell>
      <TableCell>
        <Select
          value={getValues().ships[index].size}
          onChange={(value: DockSize) => setValue(`ships.${index}.size`, value)}
        >
          <SelectButton>{getValues().ships[index].size}</SelectButton>
          <SelectOptions>
            <SelectOption value="small">small</SelectOption>
            <SelectOption value="medium">medium</SelectOption>
            <SelectOption value="large">large</SelectOption>
          </SelectOptions>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={getValues().ships[index].role}
          onChange={(value) => setValue(`ships.${index}.role`, value)}
        >
          <SelectButton>{getValues().ships[index].role}</SelectButton>
          <SelectOptions>
            {shipRoles.map((role) => (
              <SelectOption key={role} value={role}>
                {role}
              </SelectOption>
            ))}
          </SelectOptions>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={getValues().ships[index].texture}
          onChange={(value: keyof Textures) =>
            setValue(`ships.${index}.texture`, value)
          }
        >
          <SelectButton>
            <div className={styles.textureLabel}>
              {Object.keys(textures).find(
                (key) => key === getValues().ships[index].texture
              )}
              <SVG
                className={styles.texturePreview}
                src={textures[getValues().ships[index].texture]}
              />
            </div>
          </SelectButton>
          <SelectOptions>
            {Object.keys(textures).map((key) => (
              <SelectOption key={key} value={key}>
                <div className={styles.textureLabel}>
                  {key}
                  <SVG className={styles.texturePreview} src={textures[key]} />
                </div>
              </SelectOption>
            ))}
          </SelectOptions>
        </Select>
      </TableCell>
    </tr>
  );
};

export const GeneralEditor: React.FC<{ ships: ShipInput[] }> = ({ ships }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "200px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Slug</TableHeader>
        <TableHeader>Size</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>Texture</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(ships).map((_, shipIndex) => (
        <ShipGeneralEditor index={shipIndex} key={shipIndex} />
      ))}
    </tbody>
  </Table>
);
