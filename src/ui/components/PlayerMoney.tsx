import React from "react";
import { nano, theme } from "../../style";
import { useSim } from "../atoms";

const styles = nano.sheet({
  root: {
    top: theme.spacing(1),
    padding: theme.spacing(1),
    position: "absolute",
    left: "0",
    right: "0",
    margin: "auto",
    textAlign: "center",
    maxWidth: "300px",
    width: "fit-content",
    background: theme.palette.background,
    border: `1px solid ${theme.palette.default}`,
    borderRadius: "4px",
    lineHeight: 1,
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const PlayerMoney: React.FC = () => {
  const [sim] = useSim();
  const [player, setPlayer] = React.useState(sim.queries.player.get()[0]);

  React.useEffect(() => {
    const handle = setInterval(
      () => setPlayer(sim.queries.player.get()[0]),
      1000
    );

    return () => clearInterval(handle);
  }, []);

  return (
    <div className={styles.root}>
      {player.cp.budget!.available.toFixed(0)} UTT
    </div>
  );
};

PlayerMoney.displayName = "PlayerMoney";
