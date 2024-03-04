import React from "react";
import Color from "color";
import fromPairs from "lodash/fromPairs";
import isObject from "lodash/isObject";

import "./global.scss";

const spacings = [0.25, 0.5, 0.75, 1, 2, 3, 4, 8] as const;
const texts = [1, 2, 3, 4, 5] as const;

export interface Theme {
  spacing: Record<(typeof spacings)[number], string>;
  palette: {
    background: string;
    "background-active": string;
    default: string;
    text: Record<(typeof texts)[number], string>;
    disabled: string;
    border: string;
    warning: string;
    error: string;
    success: string;
    active: string;
    primary: string;
  };
  typography: {
    button: string;
    caption: string;
    label: string;
    default: string;
    header: string;
    header2: string;
    header3: string;
    header4: string;
    header5: string;
    header6: string;
  };
  z: {
    tooltip: number;
  };
}

const getColor = (v: number): string =>
  Color.hsl(0, 0, (100 - (v - 1) * 20) * 0.85).hex();

export function createTheme(scale: number): Theme {
  const baseFontSize = 14 * scale;
  const baseSpacing = 8 * scale;

  return {
    spacing: fromPairs(
      spacings.map((n) => [n, `${n * baseSpacing}px`])
    ) as Record<(typeof spacings)[number], string>,
    palette: {
      background: "#080808",
      "background-active": "#1e1e1e",
      default: "#FFFFFF",
      text: fromPairs(texts.map((v) => [v, getColor(v)])) as Record<
        (typeof texts)[number],
        string
      >,
      disabled: getColor(4),
      border: Color.hsl(0, 0, 60).hex(),
      warning: "#ffe645",
      error: "#ff5b45",
      success: "#52fa6e",
      primary: "#f7c14a",
      active: "#f7c14a",
    },
    typography: {
      button: `${baseFontSize * 0.875}px`,
      caption: `${baseFontSize * 0.75}px`,
      label: `${baseFontSize * 0.875}px`,
      default: `${baseFontSize}px`,
      header: `${Math.ceil(baseFontSize * 1.3 ** 2)}px`,
      header2: `${Math.ceil(baseFontSize * 1.3)}px`,
      header3: `${Math.ceil(baseFontSize * 1.2)}px`,
      header4: `${Math.ceil(baseFontSize * 1.1)}px`,
      header5: `${Math.ceil(baseFontSize * 1.1)}px`,
      header6: `${Math.ceil(baseFontSize * 1.1)}px`,
    },
    z: {
      tooltip: 100,
    },
  };
}

function getProperties(
  o: Object,
  prefix = ""
): Array<{ key: string; value: string }> {
  return Object.entries(o).flatMap(([k, v]) => {
    if (isObject(v)) {
      return getProperties(v, `${prefix + k}-`);
    }
    return { key: prefix + k, value: v };
  });
}

export const Styles: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [scale] = React.useState(1);
  const theme = React.useMemo(() => createTheme(scale), [scale]);
  const cssVariables = React.useRef(
    document.querySelector("style[data-css-variables]")
  );

  React.useEffect(() => {
    const styleTag = document.createElement("style");
    document.head.append(styleTag);
    styleTag.innerHTML =
      // eslint-disable-next-line quotes
      '@import url("https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap");';
  }, []);

  React.useEffect(() => {
    if (!cssVariables.current) {
      const styleTag = document.createElement("style");
      styleTag.setAttribute("data-css-variable", "true");
      document.head.append(styleTag);
      cssVariables.current = styleTag;
    }

    cssVariables.current!.innerHTML = `:root { ${[
      `--spacing: ${theme.spacing[1]};`,
      ...getProperties(theme).map(
        ({ key, value }) => `--${key.replace(/\./g, "-")}: ${value};`
      ),
    ].join(" ")} }`;
  }, [theme]);

  return children as any;
};

const documentStyles = getComputedStyle(document.documentElement);
export function getVar(varName: string): string {
  return documentStyles.getPropertyValue(varName).trim();
}
