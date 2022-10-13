import React from "react";
import { Route, Routes } from "react-router-dom";
import { Ships } from "./ships";
import "@alenaksu/json-viewer";

export const DevTools: React.FC = () => (
  <Routes>
    <Route path="ships" element={<Ships />} />
  </Routes>
);
