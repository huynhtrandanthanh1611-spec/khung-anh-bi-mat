import { useEffect, useRef, useState } from "react";
import {
  Play,
  Volume2,
  VolumeX,
  Maximize,
  LogOut,
  ArrowRight,
  RotateCcw,
  Check,
} from "lucide-react";
import type { Game } from "@/types/game";
import PuzzleBoard from "@/components/puzzle/PuzzleBoard";
import { Modal } from "@/components/shared";
import { Rainbow, Sun, Confetti } from "./Decor";
export default function GameMode({
  game,
  audio,
  onExit,
}: {
  game: Game;
  audio: HTMLAudioElement | null;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<"start" | "playing" | "reward" | "done">(
      "start",
    ),
    [index, setIndex] = useState(0),
    [sound, setSound] = useState(true),
    [confirmExit, setConfirmExit] = useState(false),
    [session, setSession] = useState(0);
  const context = useRef<AudioContext | null>(null);
  const round = game.rounds[index],
    total = game.rounds.length;
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      audio?.pause();
      void context.current?.close();
      context.current = null;
    };
  }, [audio]);
  useEffect(() => {
    if (audio) {
      audio.muted = !sound;
      if (sound) void audio.play().catch(() => {});
    }
  }, [audio, sound]);
  function wakeAudio() {
    if (audio && sound) void audio.play().catch(() => {});
    try {
      context.current ??= new AudioContext();
      void context.current.resume();
    } catch {
      /* Audio is optional. */
    }
  }
  function chime(done = false) {
    if (!sound) return;
    try {
      context.current ??= new AudioContext();
      const ctx = context.current;
      void ctx.resume();
      [0, ...(done ? [0.13, 0.26] : [])].forEach((delay, i) => {
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain(),
          start = ctx.currentTime + delay;
        oscillator.type = "sine";
        oscillator.frequency.value = [523.25, 659.25, 783.99][i];
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.07, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.32);
      });
    } catch {
      /* Silent play remains available. */
    }
  }
  function start() {
    wakeAudio();
    setIndex(0);
    setSession((v) => v + 1);
    setPhase("playing");
  }
  function fullscreen() {
    if (!document.fullscreenElement)
      void document.documentElement.requestFullscreen?.().catch(() => {});
    else void document.exitFullscreen().catch(() => {});
  }
  return (
    <div className={`game-mode phase-${phase}`}>
      <div className="game-cloud cloud-one" />
      <div className="game-cloud cloud-two" />
      <div className="game-sun">
        <Sun />
      </div>
      <span className="floating-star star-a" aria-hidden="true">
        ✦
      </span>
      <span className="floating-star star-b" aria-hidden="true">
        ✦
      </span>
      <button
        className="quiet-exit"
        aria-label="Thoát trò chơi"
        title="Thoát trò chơi"
        onClick={() => setConfirmExit(true)}
      >
        <LogOut size={17} />
        <span>Thoát</span>
      </button>
      {phase === "start" ? (
        <main className="game-welcome">
          <Rainbow />
          <span className="game-kicker">CÙNG NHAU KHÁM PHÁ</span>
          <h1>{game.title}</h1>
          <p>{total} vòng chơi thật vui đang chờ!</p>
          <button className="button game-button" onClick={start}>
            <Play size={28} fill="currentColor" />
            BẮT ĐẦU
          </button>
          <small>Kéo một mảnh, ghép một điều hay.</small>
        </main>
      ) : phase === "playing" ? (
        <main className="play-screen">
          <header className="play-heading">
            <span className="round-pill">
              VÒNG {index + 1} / {total}
            </span>
            <h1>Ghép hình cùng cô!</h1>
          </header>
          <PuzzleBoard
            key={`${session}-${round.id}`}
            round={round}
            onCorrect={() => chime()}
            onComplete={() => {
              chime(true);
              setPhase("reward");
            }}
          />
        </main>
      ) : phase === "reward" ? (
        <main className="celebration">
          <Confetti />
          <div className="reward-star" aria-hidden="true">
            ⭐
          </div>
          {!round.completionImageUrl && !round.completionText ? (
            <h1>Giỏi quá!</h1>
          ) : (
            <>
              <h1 className="congrats-title">Giỏi quá!</h1>
              {round.completionImageUrl && (
                <img
                  className="completion-image"
                  src={round.completionImageUrl}
                  alt="Ảnh chúc mừng của thầy cô"
                />
              )}
              {round.completionText && (
                <p className="completion-text">{round.completionText}</p>
              )}
            </>
          )}
          <button
            className="button game-button"
            onClick={() => {
              if (index === total - 1) {
                setPhase("done");
                chime(true);
              } else {
                setIndex((i) => i + 1);
                setPhase("playing");
              }
            }}
          >
            TIẾP TỤC
            <ArrowRight size={27} />
          </button>
        </main>
      ) : (
        <main className="celebration final-celebration">
          <Confetti />
          <Rainbow />
          <h1>Tuyệt vời!</h1>
          <p>Các con đã hoàn thành!</p>
          <div className="button-row">
            <button className="button game-button" onClick={start}>
              <RotateCcw size={26} />
              CHƠI LẠI
            </button>
            <button
              className="button game-button secondary-game"
              onClick={() => setConfirmExit(true)}
            >
              <Check size={26} />
              KẾT THÚC
            </button>
          </div>
        </main>
      )}
      <footer className="game-controls">
        <button
          className="round-control"
          aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          aria-pressed={sound}
          onClick={() => {
            setSound((v) => !v);
            if (!sound) wakeAudio();
          }}
        >
          {sound ? <Volume2 size={25} /> : <VolumeX size={25} />}
        </button>
        <button
          className="round-control"
          aria-label="Bật hoặc tắt toàn màn hình"
          onClick={fullscreen}
        >
          <Maximize size={23} />
        </button>
      </footer>
      {confirmExit && (
        <Modal
          title="Bạn muốn kết thúc trò chơi?"
          onClose={() => setConfirmExit(false)}
        >
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => setConfirmExit(false)}
            >
              Tiếp tục chơi
            </button>
            <button className="button soft" onClick={onExit}>
              Kết thúc
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
