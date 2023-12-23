import React from "react";
import { Sim } from "@core/sim";
import { createBaseConfig } from "@core/sim/baseConfig";
import { useLocation } from "../context/Location";
import { View } from "../components/View";
import { useSim } from "../atoms";

export const NewGame: React.FC = () => {
  const navigate = useLocation();
  const [progress, setProgress] = React.useState(0);
  const sim = React.useRef<Sim>();
  const [, setSim] = useSim();

  React.useEffect(() => {
    async function load() {
      const data = await import("@core/world/data/base.json");
      setProgress(0.5);
      sim.current = Sim.load(createBaseConfig(), JSON.stringify(data.default));
      setSim(sim.current);
      navigate("game");
    }
    sim.current?.destroy();
    load();
  }, []);

  return (
    <View showBack={false} title="Starting new game...">
      {`${(progress * 100).toFixed(0)}%`}
    </View>
  );
};
NewGame.displayName = "NewGame";
