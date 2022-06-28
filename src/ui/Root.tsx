import React from "react";
import { LocationContext, View } from "./context/Location";
import { Game } from "./views/Game";
import { LoadGame } from "./views/Load";
import { Main } from "./views/Main";

const viewComponents: Record<View, React.FC> = {
  game: Game,
  main: Main,
  settings: Main,
  load: LoadGame,
};

export const Root: React.FC = () => {
  const [view, setView] = React.useState<View>("main");
  const Component = React.useMemo(() => viewComponents[view], [view]);

  return (
    <LocationContext.Provider value={setView}>
      <Component />
    </LocationContext.Provider>
  );
};
