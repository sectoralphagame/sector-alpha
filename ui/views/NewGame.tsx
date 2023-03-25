import React from "react";
import { Sim } from "@core/sim";
import { getFixedWorld as world } from "@core/world";
import settings from "@core/settings";
import { useLocation } from "../context/Location";
import { View } from "../components/View";
import { useWorker } from "../hooks/useWorker";
import type { HeadlessSimMsg } from "../workers/headlessSim";
import { useSim } from "../atoms";

export const NewGame: React.FC = () => {
  const navigate = useLocation();
  const [progress, setProgress] = React.useState(0);
  const sim = React.useRef<Sim>();
  const [, setSim] = useSim();

  const headlessSimWorker = useWorker(
    () => new Worker(new URL("../workers/headlessSim.ts", import.meta.url)),
    (worker) => {
      worker.onmessage = (event: MessageEvent<HeadlessSimMsg>) => {
        if (event.data.type === "update") {
          setProgress(event.data.time / settings.bootTime);
        }
        if (event.data.type === "completed") {
          sim.current?.destroy();
          sim.current = Sim.load(event.data.data);
          setSim(sim.current);
          navigate("game");
        }
      };
    }
  );

  React.useEffect(() => {
    sim.current?.destroy();
    sim.current = new Sim();
    sim.current.init();
    world(sim.current).then(() => {
      headlessSimWorker.current?.postMessage({
        type: "init",
        delta: 1,
        targetTime: settings.bootTime,
        sim: sim.current!.serialize(),
      });
    });
  }, []);

  return (
    <View showBack={false} title="Starting new game...">
      {`${(progress * 100).toFixed(0)}%`}
    </View>
  );
};
NewGame.displayName = "NewGame";
