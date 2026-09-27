import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Home from "../app/page";
import Play from "../app/play/[code]/page";
import Dashboard from "../components/teacher/Dashboard";
import TeacherGate from "../components/teacher/TeacherGate";
import GameEditor from "../components/teacher/GameEditor";
import NewGame from "../app/teacher/games/new/page";
import "../app/globals.css";

function TeacherLayout() {
  return (
    <TeacherGate>
      <Outlet />
    </TeacherGate>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:code" element={<Play />} />
        <Route element={<TeacherLayout />}>
          <Route path="/teacher" element={<Dashboard />} />
          <Route path="/teacher/games" element={<Dashboard />} />
          <Route path="/teacher/new" element={<NewGame />} />
          <Route path="/teacher/edit" element={<GameEditor />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
