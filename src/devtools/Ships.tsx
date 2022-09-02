import React from "react";
import throttle from "lodash/throttle";
import {
  useForm,
  useWatch,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import { nano, theme } from "../style";
import { shipClasses, ShipInput } from "../world/ships";
import { Input, LabeledInput } from "../ui/components/Input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "../ui/components/Collapsible";
import { Button } from "../ui/components/Button";

type FormData = { ships: ShipInput[] };

function useThrottledFormState<T>(name?: string): T {
  const data = useWatch(name ? { name } : undefined!);
  const [display, setDisplay] = React.useState<T>();
  const refreshDisplay = React.useCallback(throttle(setDisplay, 500), []);

  React.useEffect(() => {
    refreshDisplay(data);
  }, [data]);

  return display!;
}

const styles = nano.sheet({
  editorContainer: {
    overflowY: "scroll",
    padding: theme.spacing(1),
  },
  editor: {
    "& input": {
      width: "100%",
    },
    display: "grid",
    gridTemplateColumns: "200px 200px 100px 100px 100px 50px",
    gap: theme.spacing(2),
    marginLeft: 0,
  },
  root: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    height: "100vh",
  },
  viewer: {
    borderLeft: `1px solid ${theme.palette.default}`,
    padding: theme.spacing(1),
    overflowY: "scroll",
    fontFamily: "monospace",
    lineBreak: "anywhere",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    padding: `${theme.spacing(1)} 0`,
  },
  copy: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  add: {
    marginBottom: theme.spacing(2),
  },
});

function getShipTravelTime(ship: ShipInput, distance: number): number {
  return ship.ttc + distance / ship.cruise;
}

function getShipTravelSpeed(ship: ShipInput, distance: number): number {
  return distance / getShipTravelTime(ship, distance);
}

function getShipStorageEfficiency(ship: ShipInput, distance: number): number {
  return ship.storage * getShipTravelSpeed(ship, distance);
}

// eslint-disable-next-line no-unused-vars
function withDistance(cb: (distance: number) => any): string {
  return [10, 100, 1000, 10000].map(cb).join("/");
}

const JSONOutput: React.FC = () => {
  const data = useThrottledFormState<FormData>();
  const display = React.useMemo(
    () => (data ? JSON.stringify(Object.values(data!)[0]) : null),
    [data]
  );

  return (
    <div className={styles.viewer}>
      <Button
        className={styles.copy}
        onClick={() => {
          navigator.clipboard.writeText(display!);
        }}
      >
        Copy
      </Button>
      {display}
    </div>
  );
};

const ShipEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);

  if (!ship) {
    return null;
  }

  return (
    <Collapsible>
      <CollapsibleSummary className={styles.editor}>
        <Input
          {...register(`ships.${index}.name`)}
          defaultValue={getValues().ships[index].name}
        />
        <div>
          Drive {withDistance((d) => getShipTravelSpeed(ship, d).toFixed(2))}
        </div>
        <div>
          Storage{" "}
          {withDistance((d) => getShipStorageEfficiency(ship, d).toFixed(0))}
        </div>
      </CollapsibleSummary>
      <CollapsibleContent className={styles.editor}>
        <div />
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.cruise`, {
              valueAsNumber: true,
            })}
            label="Cruise"
            defaultValue={getValues().ships[index].cruise}
            type="number"
          />
          <LabeledInput
            {...register(`ships.${index}.maneuver`, {
              valueAsNumber: true,
            })}
            label="Maneuver"
            defaultValue={getValues().ships[index].maneuver}
            type="number"
          />
          <LabeledInput
            {...register(`ships.${index}.rotary`, {
              valueAsNumber: true,
            })}
            label="Rotary"
            defaultValue={getValues().ships[index].rotary}
            type="number"
          />
          <LabeledInput
            {...register(`ships.${index}.ttc`, { valueAsNumber: true })}
            label="Time to cruise"
            defaultValue={getValues().ships[index].ttc}
            type="number"
          />
        </div>
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.storage`, {
              valueAsNumber: true,
            })}
            label="Storage"
            defaultValue={getValues().ships[index].storage}
            type="number"
          />
        </div>
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.mining`, {
              valueAsNumber: true,
            })}
            label="Mining"
            defaultValue={getValues().ships[index].mining}
            type="number"
          />
        </div>
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.texture`)}
            label="Texture"
            defaultValue={getValues().ships[index].texture}
          />
        </div>
        <div className={styles.column}>
          <LabeledInput
            {...register(`ships.${index}.size`)}
            label="Size"
            defaultValue={getValues().ships[index].size}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "ships" });
  const [ships, setShips] = React.useState(getValues().ships);

  return (
    <div className={styles.editorContainer}>
      <Button
        onClick={() => {
          append({
            cruise: 0,
            maneuver: 0,
            rotary: 0,
            ttc: 0,
            name: "New Ship",
            size: "medium",
            storage: 0,
            texture: "mCiv",
          });
          setShips(getValues().ships);
        }}
        className={styles.add}
      >
        + Add new
      </Button>
      {Object.values(ships).map((_, shipIndex) => (
        <ShipEditor index={shipIndex} key={shipIndex} />
      ))}
    </div>
  );
};

export const Ships: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: { ships: shipClasses },
  });

  return (
    <FormProvider {...form}>
      <div className={styles.root}>
        <Editor />
        <JSONOutput />
      </div>
    </FormProvider>
  );
};
