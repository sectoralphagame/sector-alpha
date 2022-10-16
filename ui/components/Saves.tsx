import clsx from "clsx";
import React from "react";
import SVG from "react-inlinesvg";
import { Save } from "@core/db";
import closeIcon from "@assets/ui/close.svg";
import { Button } from "@kit/Button";
import { IconButton } from "@kit/IconButton";
import styles from "./Saves.scss";

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
