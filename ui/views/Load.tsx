import React from "react";
import { Sim } from "@core/sim";
import type { Save } from "@core/db";
import { createBaseConfig } from "@core/sim/baseConfig";
import LZString from "lz-string";
import { regen } from "@core/systems/pathPlanning";
import { useLocation } from "../context/Location";
import { Saves } from "../components/Saves";
import { View } from "../components/View";
import { useSim } from "../atoms";

export const LoadGame: React.FC = () => {
  const navigate = useLocation();
  const [saves, setSaves] = React.useState<Save[]>();
  const [, setSim] = useSim();

  React.useEffect(() => {
    Sim.listSaves().then(setSaves);
  }, []);

  return (
    <View title="Load Game">
      <div>
        {!!saves && (
          <Saves
            saves={saves}
            onClick={async (id) => {
              const sim = Sim.load(
                createBaseConfig(),
                LZString.decompress(saves.find((s) => s.id === id)!.data)
              );
              setSim(sim);
              regen(sim);
              navigate("game");
            }}
            onDelete={async (id) => {
              await Sim.deleteSave(id);
              Sim.listSaves().then(setSaves);
            }}
          />
        )}
      </div>
    </View>
  );
};
LoadGame.displayName = "LoadGame";
