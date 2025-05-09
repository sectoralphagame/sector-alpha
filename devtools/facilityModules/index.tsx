import React from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import facilityModulesData from "@core/world/data/facilityModules.json";
import { Button } from "@kit/Button";
import { Tab, TabList } from "@kit/Tabs";
import type { FacilityModuleInput } from "@core/archetypes/facilityModule";
import type { FormData } from "./utils";
import styles from "./styles.scss";
import { JSONOutput } from "../components/JSONOutput";
import { BuildEditor } from "./Build";
import { GeneralEditor } from "./General";
import { ProductionEditor } from "./Production";
import { CrewEditor } from "./Crew";

const Editor: React.FC<{}> = () => {
  const { control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "facilityModules" });

  return (
    <div className={styles.editorContainer}>
      <HeadlessTab.Group>
        <div className={styles.toolbar}>
          <Button
            color="primary"
            onClick={() => {
              append({
                name: "",
                type: "production",
                pac: {},
                slug: "",
                build: {
                  cost: {},
                  time: 0,
                },
                crew: {
                  cost: 0,
                },
              });
            }}
          >
            + Add new Module
          </Button>
          <TabList>
            <Tab>General</Tab>
            <Tab>Production</Tab>
            <Tab>Build</Tab>
            <Tab>Crew</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <div className={styles.editor}>
          <HeadlessTab.Panels>
            <HeadlessTab.Panel>
              <GeneralEditor />
            </HeadlessTab.Panel>
            <HeadlessTab.Panel>
              <ProductionEditor />
            </HeadlessTab.Panel>
            <HeadlessTab.Panel>
              <BuildEditor />
            </HeadlessTab.Panel>
            <HeadlessTab.Panel>
              <CrewEditor />
            </HeadlessTab.Panel>
          </HeadlessTab.Panels>
        </div>
      </HeadlessTab.Group>
    </div>
  );
};

export const FacilityModules: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: {
      facilityModules: facilityModulesData as FacilityModuleInput[],
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
          fn={(data) => Object.values(data!)[0]}
          expanded={expanded}
          onExpand={() => setExpanded(!expanded)}
        />
      </div>
    </FormProvider>
  );
};
