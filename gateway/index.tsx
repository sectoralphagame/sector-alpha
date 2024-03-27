import { Styles } from "@kit/theming/style";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Root } from "@ui/index";
import { isDev } from "@core/settings";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import packageJson from "../package.json";

let ErrorBoundary: React.FC<React.PropsWithChildren<{}>> = ({ children }) =>
  // @ts-expect-error
  children;

if (process.env.BUGSNAG_API_KEY) {
  Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY,
    plugins: [new BugsnagPluginReact()],
    appVersion: packageJson.version,
    releaseStage: process.env.BUILD_ENV,
  });
  // @ts-expect-error
  ErrorBoundary = Bugsnag.getPlugin("react")!.createErrorBoundary(React);
}

const root = createRoot(document.querySelector("#root")!);
const DevTools = isDev ? React.lazy(() => import("../devtools")) : () => null;

root.render(
  <ErrorBoundary>
    <Styles>
      <BrowserRouter>
        <Routes>
          {isDev && <Route path="dev/*" element={<DevTools />} />}
          <Route path="*" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </Styles>
  </ErrorBoundary>
);
