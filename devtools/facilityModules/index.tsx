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

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "facilityModules" });
  const [facilityModules, setFacilityModules] = React.useState(
    getValues().facilityModules
  );

  return (
    <div className={styles.editorContainer}>
      <HeadlessTab.Group>
        <div className={styles.toolbar}>
          <Button
            onClick={() => {
              append({
                name: "",
                type: "production",
                pac: {},
                slug: "",
                time: 0,
                build: {
                  cost: {},
                  time: 0,
                },
              });
              setFacilityModules(getValues().facilityModules);
            }}
          >
            + Add new Module
          </Button>
          <TabList>
            <Tab>General</Tab>
            <Tab>Production</Tab>
            <Tab>Build</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <HeadlessTab.Panels>
          <HeadlessTab.Panel>
            <GeneralEditor facilityModules={facilityModules} />
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <ProductionEditor facilityModules={facilityModules} />
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <BuildEditor facilityModules={facilityModules} />
          </HeadlessTab.Panel>
        </HeadlessTab.Panels>
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
          expanded={expanded}
          onExpand={() => setExpanded(!expanded)}
        />
      </div>
    </FormProvider>
  );
};
