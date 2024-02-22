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
import { RelationEditor } from "./Relations";
import { BlueprintsEditor } from "./Blueprints";

const Editor: React.FC<{}> = () => {
  const { getValues, control } = useFormContext<FormData>();
  const { append } = useFieldArray({ control, name: "factions" });
  const { append: appendRelation } = useFieldArray({
    control,
    name: "relations",
  });
  const [form, setForm] = React.useState(getValues());

  return (
    <div className={styles.editorContainer}>
      <HeadlessTab.Group>
        <div className={styles.toolbar}>
          <Button
            onClick={() => {
              append({
                home: "",
                name: "",
                blueprints: { facilityModules: [], ships: [] },
                color: "#ffffff",
                sectors: [],
                slug: "",
                type: "territorial",
              });
              const newFactions = getValues().factions;
              newFactions.slice(0, newFactions.length - 2).forEach((_, index) =>
                appendRelation({
                  factions: [index, newFactions.length - 1],
                  value: 0,
                })
              );
              setForm(getValues());
            }}
          >
            + Add new faction
          </Button>
          <TabList>
            <Tab>General</Tab>
            <Tab>Relations</Tab>
            <Tab>Blueprints</Tab>
          </TabList>
        </div>

        <hr className={styles.hr} />

        <HeadlessTab.Panels>
          <HeadlessTab.Panel>
            <GeneralEditor factions={form.factions} />
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <RelationEditor />
          </HeadlessTab.Panel>
          <HeadlessTab.Panel>
            <BlueprintsEditor factions={form.factions} />
          </HeadlessTab.Panel>
        </HeadlessTab.Panels>
      </HeadlessTab.Group>
    </div>
  );
};

export const Factions: React.FC = () => {
  const form = useForm<FormData>({
    defaultValues: {
      ...mapData,
      relations: mapData.factions
        .flatMap((fY, y) =>
          mapData.factions.map((fX, x) => ({
            factions: [x, y],
            value:
              mapData.relations.find(
                ({ factions }) =>
                  factions.includes(fX.slug) && factions.includes(fY.slug)
              )?.value ?? 0,
          }))
        )
        .filter(({ factions: [x, y] }) => y > x),
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
          fn={(data: FormData) => ({
            ...data,
            relations: data.relations.map((relation) => ({
              ...relation,
              factions: relation.factions.map((f) => data.factions[f].slug),
            })),
          })}
          expanded={expanded}
          onExpand={() => setExpanded(!expanded)}
        />
      </div>
    </FormProvider>
  );
};
