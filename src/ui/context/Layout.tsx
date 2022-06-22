import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const LayoutContext = createContext<{
  isCollapsed: boolean;
  toggleCollapse: () => void;
}>(undefined!);

export const LayoutProvider: React.FC = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const toggleCollapse = useCallback(
    () => setIsCollapsed((prevIsCollapsed) => !prevIsCollapsed),
    []
  );
  const contextValue = useMemo(
    () => ({
      isCollapsed,
      toggleCollapse,
    }),
    [isCollapsed]
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
