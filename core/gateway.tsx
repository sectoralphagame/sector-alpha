import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Root } from "./ui";
import { DevTools } from "./devtools";

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="dev/*" element={<DevTools />} />
      <Route path="*" element={<Root />} />
    </Routes>
  </BrowserRouter>,
  document.querySelector("#root")
);
