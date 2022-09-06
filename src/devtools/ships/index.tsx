import React from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import { shipClasses } from "../../world/ships";
import { Button } from "../../ui/components/Button";
import { Tab, TabList } from "../../ui/components/Tabs";
import { FormData } from "./utils";
import { styles } from "./styles";
import { ShipGeneralEditor } from "./General";
import { ShipFreightEditor } from "./Freight";
import { JSONOutput } from "./JSONOutput";

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "ships" });
  const [ships, setShips] = React.useState(getValues().ships);

  return (
    <div className={styles.editorContainer}>
      <HeadlessTab.Group>
        <div className={styles.toolbar}>
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
          >
            + Add new ship
          </Button>
          <TabList>
            <Tab>General</Tab>
            <Tab>Freight</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <HeadlessTab.Panels>
          <HeadlessTab.Panel>
            {Object.values(ships).map((_, shipIndex) => (
              <ShipGeneralEditor index={shipIndex} key={shipIndex} />
            ))}
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <div className={styles.editor}>
              <div />
              <div>Speed [su/s]</div>
              <div>Storage [Ksu/h]</div>
              <div>Mining [Ksu/h]</div>
            </div>
            {Object.values(ships).map((_, shipIndex) => (
              <ShipFreightEditor index={shipIndex} key={shipIndex} />
            ))}
          </HeadlessTab.Panel>
        </HeadlessTab.Panels>
      </HeadlessTab.Group>
    </div>
  );
};

export const Ships: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: { ships: shipClasses },
  });
  const [expanded, setExpanded] = React.useState(false);

  return (
    <FormProvider {...form}>
      <div
        className={clsx(styles.root, {
          [styles.rootExpanded]: expanded,
        })}
      >
        <Editor />
        <JSONOutput
          expanded={expanded}
          onExpand={() => setExpanded(!expanded)}
        />
      </div>
    </FormProvider>
  );
};
