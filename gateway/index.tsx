import { Styles } from "@kit/theming/style";
import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DevTools } from "@devtools/index";
import { Root } from "@ui/index";

ReactDOM.render(
  <Styles>
    <BrowserRouter>
      <Routes>
        <Route path="dev/*" element={<DevTools />} />
        <Route path="*" element={<Root />} />
      </Routes>
    </BrowserRouter>
  </Styles>,
  document.querySelector("#root")
);
