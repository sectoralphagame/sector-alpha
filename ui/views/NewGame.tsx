import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Sim } from "@core/sim";
import { getFixedWorld as world } from "@core/world";
import { Slider } from "@kit/Slider";
import { Button } from "@kit/Button";
import Text from "@kit/Text";
import { useLocation } from "../context/Location";
import styles from "./NewGame.scss";
import { View } from "../components/View";
import { useWorker } from "../hooks/useWorker";
import { HeadlessSimMsg } from "../workers/headlessSim";
import { useSim } from "../atoms";

interface NewGameForm {
  factions: number;
  islands: number;
}

const targetTime = 3600 / 20;

export const NewGame: React.FC = () => {
  const { register, handleSubmit, getValues, control } = useForm<NewGameForm>({
    defaultValues: { islands: 8, factions: 4 },
  });
  const navigate = useLocation();
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const sim = React.useRef<Sim>();
  const [, setSim] = useSim();

  const headlessSimWorker = useWorker(
    () => new Worker(new URL("../workers/headlessSim.ts", import.meta.url)),
    (worker) => {
      worker.onmessage = (event: MessageEvent<HeadlessSimMsg>) => {
        if (event.data.type === "update") {
          setProgress(event.data.time / targetTime);
        }
        if (event.data.type === "completed") {
          sim.current?.destroy();
          sim.current = Sim.load(event.data.data);
          window.sim = sim.current;
          setSim(sim.current);
          navigate("game");
        }
      };
    }
  );

  const onSubmit = handleSubmit(async () => {
    let tries = 0;
    for (; tries < 20; tries++) {
      sim.current?.destroy();
      sim.current = new Sim();
      sim.current.init();
      window.sim = sim.current;
      setLoading(true);
      try {
        // eslint-disable-next-line no-await-in-loop
        await world(sim.current, getValues().islands, getValues().factions);
        break;
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (tries === 20) {
      throw new Error("Maximum tries exceeded");
    } else {
      headlessSimWorker.current?.postMessage({
        type: "init",
        delta: 1,
        targetTime,
        sim: sim.current!.serialize(),
      });
    }
  });

  return (
    <View showBack={!loading} title={loading ? "" : "Start New Game"}>
      {loading ? (
        `Loading... ${(progress * 100).toFixed(0)}%`
      ) : (
        <>
          <Text>Adjust world settings</Text>
          <div className={styles.labelContainer}>
            <Controller
              name="islands"
              control={control}
              render={({ field }) => (
                <>
                  <label htmlFor="islands">Islands: {field.value}</label>
                  <Slider
                    {...register("islands")}
                    className={styles.slider}
                    min={8}
                    max={16}
                    step={1}
                  />
                </>
              )}
            />
          </div>
          <div className={styles.labelContainer}>
            <Controller
              name="factions"
              control={control}
              render={({ field }) => (
                <>
                  <label htmlFor="factions">
                    Major Factions: {field.value}
                  </label>
                  <Slider
                    {...register("factions")}
                    className={styles.slider}
                    min={4}
                    max={8}
                    step={1}
                  />
                </>
              )}
            />
          </div>
          <Button className={styles.button} onClick={onSubmit}>
            Start
          </Button>
        </>
      )}
    </View>
  );
};
NewGame.displayName = "NewGame";
