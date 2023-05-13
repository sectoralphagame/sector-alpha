import { Styles } from "@kit/theming/style";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Root } from "@ui/index";
import { isDev } from "@core/settings";

const root = createRoot(document.querySelector("#root")!);
const DevTools = isDev ? React.lazy(() => import("../devtools")) : () => null;

root.render(
  <Styles>
    <BrowserRouter>
      <Routes>
        {isDev && <Route path="dev/*" element={<DevTools />} />}
        <Route path="*" element={<Root />} />
      </Routes>
    </BrowserRouter>
  </Styles>
);
