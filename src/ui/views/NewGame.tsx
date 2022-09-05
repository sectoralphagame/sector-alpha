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

export const NewGame: React.FC = () => {
  const { register, handleSubmit, getValues, control } = useForm<NewGameForm>({
    defaultValues: { islands: 8, factions: 4 },
  });
  const navigate = useLocation();
  const [loading, setLoading] = React.useState(false);

  const onSubmit = handleSubmit(async () => {
    let sim: Sim;
    let success = false;
    while (!success) {
      sim = new Sim();
      sim.init();
      window.sim = sim;
      setLoading(true);
      try {
        // eslint-disable-next-line no-await-in-loop
        await world(sim, getValues().islands, getValues().factions);
        success = true;
      } catch {}
    }
    sim!.start();
    navigate("game");
  });

  return (
    <View showBack={!loading} title={loading ? "" : "Start New Game"}>
      {loading ? (
        "Loading"
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
