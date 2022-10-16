import React from "react";
import { useSim } from "../atoms";
import { useRerender } from "../hooks/useRerender";
import styles from "./PlayerMoney.scss";

export const PlayerMoney: React.FC = () => {
  const [sim] = useSim();
  const [player, setPlayer] = React.useState(sim.queries.player.get()[0]);

  useRerender(1000);

  React.useEffect(() => {
    const handle = setInterval(
      () => setPlayer(sim.queries.player.get()[0]),
      1000
    );

    return () => clearInterval(handle);
  }, []);

  return (
    <div id="money" className={styles.root}>
      {player.cp.budget!.available.toFixed(0)} UTT
    </div>
  );
};

PlayerMoney.displayName = "PlayerMoney";
