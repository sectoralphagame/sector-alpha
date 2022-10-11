import clsx from "clsx";
import React from "react";
import SVG from "react-inlinesvg";
import { Save } from "../../db";
import { nano, theme } from "../../style";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import closeIcon from "../../../assets/ui/close.svg";

const styles = nano.sheet({
  buttonContainer: {
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
    width: "100%",
  },
  saveContainer: {
    "& > button:first-child": {
      flex: 1,
    },
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
});

export interface SavesProps {
  saves: Save[];
  // eslint-disable-next-line no-unused-vars
  onClick: (id: number) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete: (id: number) => void;
}

export const Saves: React.FC<SavesProps> = ({ saves, onClick, onDelete }) => (
  <div>
    {!!saves &&
      saves.map((save) => (
        <div
          className={clsx(styles.buttonContainer, styles.saveContainer)}
          key={save.id}
        >
          <Button onClick={() => onClick(save.id!)}>{save.name}</Button>
          <IconButton onClick={() => onDelete(save.id!)}>
            <SVG src={closeIcon} />
          </IconButton>
        </div>
      ))}
  </div>
);
