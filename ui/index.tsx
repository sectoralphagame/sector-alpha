import React from "react";
import { RecoilRoot } from "recoil";
import type { View } from "./context/Location";
import { LocationContext } from "./context/Location";
import { Game } from "./views/Game";
import { LoadGame } from "./views/Load";
import { Main } from "./views/Main";
import { NewGame } from "./views/NewGame";
import { SettingsView } from "./views/Settings";

const viewComponents: Record<View, React.FC> = {
  game: Game,
  main: Main,
  settings: SettingsView,
  load: LoadGame,
  new: NewGame,
};

export const Root: React.FC = () => {
  const [view, setView] = React.useState<View>("main");
  const Component = React.useMemo(() => viewComponents[view], [view]);

  return (
    <div style={{ userSelect: "none", display: "contents" }}>
      <RecoilRoot>
        <LocationContext.Provider value={setView}>
          <Component />
        </LocationContext.Provider>
      </RecoilRoot>
    </div>
  );
};
