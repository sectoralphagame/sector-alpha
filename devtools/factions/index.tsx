import React from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import mapData from "@core/world/data/map.json";
import { Button } from "@kit/Button";
import { Tab, TabList } from "@kit/Tabs";
import type { FormData } from "./utils";
import styles from "./styles.scss";
import { JSONOutput } from "../components/JSONOutput";
import { GeneralEditor } from "./General";

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "factions" });
  const [factions, setFactions] = React.useState(getValues().factions);

  return (
    <div className={styles.editorContainer}>
      <HeadlessTab.Group>
        <div className={styles.toolbar}>
          <Button
            onClick={() => {
              append({
                name: "",
                blueprints: [],
                color: "#ffffff",
                sectors: [],
                slug: "",
                type: "territorial",
              });
              setFactions(getValues().factions);
            }}
          >
            + Add new faction
          </Button>
          <TabList>
            <Tab>General</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <HeadlessTab.Panels>
          <HeadlessTab.Panel>
            <GeneralEditor factions={factions} />
          </HeadlessTab.Panel>
        </HeadlessTab.Panels>
      </HeadlessTab.Group>
    </div>
  );
};

export const Factions: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: mapData,
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
          fn={(data) => data}
          expanded={expanded}
          onExpand={() => setExpanded(!expanded)}
        />
      </div>
    </FormProvider>
  );
};
