import { Styles } from "@kit/theming/style";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Root } from "@ui/index";
import { isDev } from "@core/settings";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { DraggablePane } from "@ui/context/Pane";
import packageJson from "../package.json";

let ErrorBoundary: React.FC<
  React.PropsWithChildren<{ FallbackComponent: React.FC; onError: () => void }>
> = ({ children, FallbackComponent, onError }) => (
  <ReactErrorBoundary fallbackRender={FallbackComponent} onError={onError}>
    {children}
  </ReactErrorBoundary>
);

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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("../sw.ts", import.meta.url));
}

const root = createRoot(document.querySelector("#root")!);
const DevTools = isDev ? React.lazy(() => import("../devtools")) : () => null;

const ErrorView: React.FC = () => (
  <div id="error">
    <div>
      <h3>Something went wrong :(</h3>
      <p>
        Try reloading the page, or contact{" "}
        <a href="https://discord.gg/2PnbGRYe">our support</a>.
      </p>
    </div>
  </div>
);

root.render(
  <ErrorBoundary
    FallbackComponent={ErrorView}
    onError={() => {
      window.sim?.stop();
    }}
  >
    <Styles>
      <BrowserRouter>
        <DraggablePane />
        <Routes>
          {isDev && <Route path="dev/*" element={<DevTools />} />}
          <Route path="*" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </Styles>
  </ErrorBoundary>
);
