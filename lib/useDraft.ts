"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";
import type { Game } from "@/types/game";
export function useDraft(id: string) {
  const [game, setGame] = useState<Game | null>(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Đang tải…"),
    [revision, setRevision] = useState(0);
  const current = useRef<Game | null>(null),
    rev = useRef(0),
    saved = useRef(0),
    flight = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let live = true;
    api<Game>(`/api/games/${id}`)
      .then((g) => {
        if (live) {
          current.current = g;
          setGame(g);
          setStatus("Đã lưu");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id]);
  const change = useCallback((fn: (g: Game) => Game) => {
    if (!current.current) return;
    current.current = fn(current.current);
    setGame(current.current);
    rev.current++;
    setRevision(rev.current);
    setStatus("Chưa lưu");
  }, []);
  const serverChange = useCallback((patch: Partial<Game>) => {
    if (!current.current) return;
    current.current = { ...current.current, ...patch };
    setGame(current.current);
  }, []);
  const flush = useCallback(async () => {
    while (flight.current) await flight.current;
    if (!current.current || rev.current === saved.current)
      return current.current;
    const snapshot = current.current,
      target = rev.current;
    const task = (async () => {
      setStatus("Đang lưu…");
      setError("");
      try {
        const result = await api<{ version: number; updatedAt: string }>(
          `/api/games/${id}`,
          { method: "PUT", body: JSON.stringify(snapshot) },
        );
        if (current.current) {
          current.current = { ...current.current, ...result };
          setGame(current.current);
        }
        saved.current = target;
        setStatus(saved.current === rev.current ? "Đã lưu" : "Chưa lưu");
      } catch (e) {
        setError((e as Error).message);
        setStatus("Chưa lưu được");
        throw e;
      }
    })();
    flight.current = task;
    try {
      await task;
    } finally {
      if (flight.current === task) flight.current = null;
    }
    return current.current;
  }, [id]);
  useEffect(() => {
    if (!revision) return;
    const timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [revision, flush]);
  useEffect(() => {
    function before(e: BeforeUnloadEvent) {
      if (rev.current !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    function click(e: MouseEvent) {
      const a = (e.target as Element)?.closest?.("a");
      if (
        !a ||
        a.getAttribute("href")?.startsWith("#") ||
        a.target === "_blank"
      )
        return;
      if (
        rev.current !== saved.current &&
        !confirm("Có thay đổi chưa lưu. Bạn có muốn rời trang?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return { game, error, setError, status, change, flush, serverChange };
}
