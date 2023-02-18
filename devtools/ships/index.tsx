import React from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import { shipClasses } from "@core/world/ships";
import { Button } from "@kit/Button";
import { Tab, TabList } from "@kit/Tabs";
import { FormData } from "./utils";
import styles from "./styles.scss";
import { GeneralEditor } from "./General";
import { FreightEditor } from "./Freight";
import { JSONOutput } from "../components/JSONOutput";
import { BuildEditor } from "./Build";

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
                acceleration: 0,
                build: { time: 0, cost: {} },
                mining: 0,
                role: "transport",
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
            <Tab>Build</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <HeadlessTab.Panels>
          <HeadlessTab.Panel>
            <GeneralEditor ships={ships} />
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <FreightEditor ships={ships} />
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <BuildEditor ships={ships} />
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
