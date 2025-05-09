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
import type { MineableCommodity } from "@core/economy/commodity";
import { mineableCommoditiesArray } from "@core/economy/commodity";
import { fromEntries } from "@fxts/core";
import type { FormData } from "./utils";
import styles from "./styles.scss";
import { JSONOutput } from "../components/JSONOutput";
import { GeneralEditor } from "./General";

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "sectors" });
  const [sectors, setSectors] = React.useState(getValues().sectors);

  return (
    <div className={styles.editorContainer}>
      <HeadlessTab.Group>
        <div className={styles.toolbar}>
          <Button
            color="primary"
            onClick={() => {
              append({
                id: "",
                name: "",
                resources: fromEntries(
                  mineableCommoditiesArray.map(
                    (commodity) => [commodity, 0] as [MineableCommodity, number]
                  )
                ),
              });
              setSectors(getValues().sectors);
            }}
          >
            + Add new sector
          </Button>
          <TabList>
            <Tab>General</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <HeadlessTab.Panels>
          <HeadlessTab.Panel>
            <GeneralEditor sectors={sectors} />
          </HeadlessTab.Panel>
        </HeadlessTab.Panels>
      </HeadlessTab.Group>
    </div>
  );
};

export const Sectors: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: {
      ...mapData,
      sectors: mapData.sectors,
    },
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
