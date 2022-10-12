import "@ui/style";

import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DevTools } from "@devtools/index";
import { Root } from "@ui/index";

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="dev/*" element={<DevTools />} />
      <Route path="*" element={<Root />} />
    </Routes>
  </BrowserRouter>,
  document.querySelector("#root")
);
