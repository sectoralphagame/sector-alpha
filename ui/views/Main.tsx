import React from "react";
import { Button } from "@kit/Button";
import styles from "./Main.scss";
import { View } from "../components/View";
import { useLocation } from "../context/Location";

export const Main: React.FC = () => {
  const navigate = useLocation();

  return (
    <View showBack={false} title="Sector Alpha">
      <Button
        color="primary"
        className={styles.button}
        onClick={() => navigate("new")}
      >
        Start New Game
      </Button>
      <Button className={styles.button} onClick={() => navigate("load")}>
        Load Game
      </Button>
      <Button className={styles.button} onClick={() => navigate("settings")}>
        Settings
      </Button>
    </View>
  );
};
