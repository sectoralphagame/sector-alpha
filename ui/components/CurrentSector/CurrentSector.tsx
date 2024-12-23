import React from "react";
import Text from "@kit/Text";
import styles from "./styles.scss";

export interface CurrentSectorProps {
  name: string;
}

export const CurrentSector: React.FC<CurrentSectorProps> = ({ name }) => (
  <div className={styles.root}>
    <Text className={styles.text}>{name}</Text>
  </div>
);
