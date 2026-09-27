import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "@/components/teacher/Dashboard";
import GameEditor from "@/components/teacher/GameEditor";
import GameMode from "@/components/game/GameMode";
import type { Game } from "@/types/game";
import "@/app/globals.css";
export type StartGame = (game: Game, fullscreen?: boolean) => void;
function App() {
  const [session, setSession] = useState<{
    game: Game;
    audio: HTMLAudioElement | null;
  } | null>(null);
  const start: StartGame = (game, fullscreen = true) => {
    let audio: HTMLAudioElement | null = null;
    if (game.musicEnabled && game.musicUrl) {
      audio = new Audio(game.musicUrl);
      audio.loop = true;
      audio.volume = game.musicVolume;
      void audio.play().catch(() => {});
    }
    if (fullscreen && !document.fullscreenElement)
      void document.documentElement.requestFullscreen?.().catch(() => {});
    setSession({ game, audio });
  };
  const exit = () => {
    session?.audio?.pause();
    setSession(null);
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
  };
  if (session)
    return <GameMode game={session.game} audio={session.audio} onExit={exit} />;
  return (
    <Routes>
      <Route path="/" element={<Dashboard onPlay={start} />} />
      <Route path="/teacher" element={<Dashboard onPlay={start} />} />
      <Route path="/teacher/edit" element={<GameEditor onPlay={start} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
