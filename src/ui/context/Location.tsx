import { createContext, useContext } from "react";

export type View = "main" | "settings" | "game" | "load";

export const LocationContext = createContext<
  // eslint-disable-next-line no-unused-vars
  (v: View) => void
>(undefined!);

export const useLocation = () => useContext(LocationContext);
