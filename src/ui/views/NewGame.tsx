import React from "react";
import SVG from "react-inlinesvg";
import { Controller, useForm } from "react-hook-form";
import { nano, theme } from "../../style";
import { Sim } from "../../sim";
import { useLocation } from "../context/Location";
import { IconButton } from "../components/IconButton";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { Slider } from "../components/Slider";
import { Button } from "../components/Button";
import world from "../../world";

const styles = nano.sheet({
  backButton: {
    marginBottom: theme.spacing(1),
  },
  content: {},
  labelContainer: {
    marginBottom: theme.spacing(1),
  },
  button: {
    width: "100%",
  },
  header: {
    fontSize: theme.typography.header,
    marginTop: "0",
    marginBottom: theme.spacing(2),
  },
  slider: {
    width: "100%",
  },
  input: {
    marginBottom: theme.spacing(1),
    width: "100%",
  },
  container: {
    padding: theme.spacing(4),
    width: "420px",
  },
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    height: "100%",
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
    const sim = new Sim();
    sim.init();

    window.sim = sim;
    setLoading(true);
    await world(sim, getValues().islands, getValues().factions);
    sim.start();
    navigate("game");
  });

  return (
    <div className={styles.root}>
      {loading ? (
        "Loading"
      ) : (
        <div className={styles.container}>
          <IconButton
            className={styles.backButton}
            onClick={() => navigate("main")}
          >
            <SVG src={arrowLeftIcon} />
          </IconButton>
          <div className={styles.content}>
            <h1 className={styles.header}>Start New Game</h1>
            <p>Adjust world settings</p>
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
          </div>
        </div>
      )}
    </div>
  );
};
NewGame.displayName = "NewGame";
