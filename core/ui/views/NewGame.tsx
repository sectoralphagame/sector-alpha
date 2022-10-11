import React from "react";
import { Controller, useForm } from "react-hook-form";
import { nano, theme } from "../../style";
import { Sim } from "../../sim";
import { useLocation } from "../context/Location";
import { Slider } from "../components/Slider";
import { Button } from "../components/Button";
import world from "../../world";
import Text from "../components/Text";
import { View } from "../components/View";
import { useWorker } from "../hooks/useWorker";
import { HeadlessSimMsg } from "../../workers/headlessSim";
import { useSim } from "../atoms";

const styles = nano.sheet({
  labelContainer: {
    marginBottom: theme.spacing(1),
  },
  button: {
    width: "100%",
  },
  slider: {
    width: "100%",
  },
});

interface NewGameForm {
  factions: number;
  islands: number;
}

const targetTime = 3600 * 2;

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
    () => new Worker(new URL("../../workers/headlessSim.ts", import.meta.url)),
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
    let success = false;
    while (!success) {
      sim.current?.destroy();
      sim.current = new Sim();
      sim.current.init();
      window.sim = sim.current;
      setLoading(true);
      try {
        // eslint-disable-next-line no-await-in-loop
        await world(sim.current, getValues().islands, getValues().factions);
        success = true;
        // eslint-disable-next-line no-empty
      } catch {}
    }

    headlessSimWorker.current?.postMessage({
      type: "init",
      delta: 1,
      targetTime,
      sim: sim.current!.serialize(),
    });
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
