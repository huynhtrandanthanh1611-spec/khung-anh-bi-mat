"use client";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Puzzle,
  Play,
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw,
  Trophy,
  Timer,
  Check,
  Star,
} from "lucide-react";
import type { Game, PlayGame } from "@/types/game";
import { timeText, calculateScore } from "@/lib/rules";
import PuzzleBoard from "@/components/puzzle/PuzzleBoard";
export function toPreview(game: Game): PlayGame {
  return {
    title: game.title,
    description: game.description,
    musicUrl: game.musicUrl || null,
    musicEnabled: game.musicEnabled,
    musicVolume: game.musicVolume,
    timerMode: game.timerMode,
    timeLimit: game.timeLimit,
    scoreEnabled: game.scoreEnabled,
    sfxEnabled: game.sfxEnabled,
    rounds: game.rounds
      .filter((r) => r.enabled)
      .map((r) => ({
        id: r.id,
        title: r.title,
        hint: r.hint,
        completionMessage: r.completionMessage,
        width: r.width,
        height: r.height,
        rows: r.rows,
        columns: r.columns,
        imageUrl: r.imageUrl!,
      })),
  };
}
type Phase = "start" | "playing" | "roundComplete" | "done" | "timeout";
export default function StudentGame({
  game,
  preview = false,
}: {
  game: PlayGame;
  preview?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("start"),
    [index, setIndex] = useState(0),
    [completed, setCompleted] = useState(0),
    [mistakes, setMistakes] = useState(0),
    [elapsed, setElapsed] = useState(0),
    [placed, setPlaced] = useState(0),
    [sound, setSound] = useState(true),
    [musicError, setMusicError] = useState("");
  const started = useRef(0),
    audio = useRef<HTMLAudioElement>(null),
    context = useRef<AudioContext | null>(null),
    phaseRef = useRef(phase);
  phaseRef.current = phase;
  const round = game.rounds[index],
    total = game.rounds.length,
    score = calculateScore(completed, mistakes);
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = game.musicVolume;
      audio.current.muted = !sound;
    }
  }, [sound, game.musicVolume]);
  useEffect(
    () => () => {
      void context.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (
      phase !== "playing" &&
      (phase !== "roundComplete" || completed === total)
    )
      return;
    function tick() {
      const seconds = Math.floor((Date.now() - started.current) / 1000);
      setElapsed(seconds);
      if (game.timerMode === "limit" && seconds >= game.timeLimit) {
        phaseRef.current = "timeout";
        setPhase("timeout");
        audio.current?.pause();
      }
    }
    const timer = setInterval(tick, 250);
    tick();
    return () => clearInterval(timer);
  }, [phase, completed, total, game.timerMode, game.timeLimit]);
  function tone(done = false) {
    if (!sound || !game.sfxEnabled || !context.current) return;
    const ctx = context.current,
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = done ? 880 : 660;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }
  function start() {
    setIndex(0);
    setCompleted(0);
    setMistakes(0);
    setElapsed(0);
    setPlaced(0);
    setMusicError("");
    started.current = Date.now();
    phaseRef.current = "playing";
    setPhase("playing");
    if (game.sfxEnabled) {
      try {
        context.current ??= new AudioContext();
        void context.current.resume();
      } catch {
        /* sound effects are optional */
      }
    }
    if (audio.current && game.musicEnabled) {
      audio.current.currentTime = 0;
      audio.current.volume = game.musicVolume;
      audio.current.muted = !sound;
      void audio.current
        .play()
        .catch(() =>
          setMusicError(
            "Nhạc chưa phát được. Em vẫn có thể tiếp tục ghép ảnh.",
          ),
        );
    }
  }
  function finishRound() {
    if (phaseRef.current !== "playing") return;
    const seconds = Math.floor((Date.now() - started.current) / 1000);
    if (game.timerMode === "limit" && seconds >= game.timeLimit) {
      setElapsed(seconds);
      setPhase("timeout");
      phaseRef.current = "timeout";
      audio.current?.pause();
      return;
    }
    phaseRef.current = "roundComplete";
    setCompleted(index + 1);
    setPhase("roundComplete");
    tone(true);
    if (index === total - 1) {
      setElapsed(seconds);
      audio.current?.pause();
    }
  }
  if (!total)
    return (
      <div className="empty-state">
        <h2>Chưa có vòng chơi</h2>
        <p>Hãy nhờ thầy cô bật ít nhất một vòng.</p>
      </div>
    );
  const progress = Math.round(
    ((index + placed / (round.rows * round.columns)) / total) * 100,
  );
  return (
    <div className={`student-game ${preview ? "is-preview" : ""}`}>
      {game.musicUrl && (
        <audio
          ref={audio}
          src={game.musicUrl}
          loop
          preload="none"
          onError={() =>
            setMusicError("Không tải được nhạc nền. Em vẫn có thể ghép ảnh.")
          }
        />
      )}
      <header className="game-header">
        <div className="brand">
          <span className="brand-icon">
            <Puzzle />
          </span>
          <span>Khung ảnh bí mật{preview && <small>Đang xem thử</small>}</span>
        </div>
        <button
          className="button secondary"
          aria-pressed={sound}
          onClick={() => {
            setSound((v) => !v);
            if (
              !sound &&
              phase === "playing" &&
              audio.current &&
              game.musicEnabled
            )
              void audio.current.play().catch(() => {});
          }}
        >
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          <span>{sound ? "Âm thanh bật" : "Âm thanh tắt"}</span>
        </button>
      </header>
      {musicError && (
        <p className="small muted music-error" role="status">
          {musicError}
        </p>
      )}
      {phase === "start" ? (
        <main className="game-start">
          <span className="eyebrow">MỘT HÀNH TRÌNH KHÁM PHÁ</span>
          <div className="start-symbol">
            <Puzzle size={64} />
          </div>
          <h1>{game.title}</h1>
          {game.description && <p className="lead">{game.description}</p>}
          <div className="start-facts">
            <span>{total} vòng chơi</span>
            {game.timerMode === "limit" && (
              <span>
                <Timer size={18} />
                {timeText(game.timeLimit)}
              </span>
            )}
            {game.scoreEnabled && (
              <span>
                <Star size={18} />
                Có tính điểm
              </span>
            )}
          </div>
          <button className="button primary jumbo" onClick={start}>
            <Play size={24} />
            Bắt đầu trò chơi
          </button>
          <p className="muted">Chạm hoặc kéo mảnh ảnh vào đúng vị trí.</p>
        </main>
      ) : phase === "done" || phase === "timeout" ? (
        <main className="game-result">
          <div className="result-symbol">
            {phase === "done" ? <Trophy size={64} /> : <Timer size={64} />}
          </div>
          <span className="eyebrow">
            {phase === "done" ? "THẬT TUYỆT VỜI" : "HẸN LẦN THỬ TIẾP THEO"}
          </span>
          <h1>{phase === "done" ? "Hoàn thành!" : "Hết thời gian rồi!"}</h1>
          <p className="lead">
            Bạn đã hoàn thành {completed}/{total} vòng chơi.
          </p>
          <div className="result-stats">
            {game.timerMode !== "none" && (
              <div>
                <span>Thời gian</span>
                <strong>
                  {timeText(
                    game.timerMode === "limit"
                      ? Math.min(elapsed, game.timeLimit)
                      : elapsed,
                  )}
                </strong>
              </div>
            )}
            {game.scoreEnabled && (
              <div>
                <span>Điểm</span>
                <strong>{score}</strong>
              </div>
            )}
            <div>
              <span>Đặt sai</span>
              <strong>{mistakes}</strong>
            </div>
          </div>
          <div className="button-row centered">
            <button className="button primary" onClick={start}>
              <RotateCcw size={19} />
              Chơi lại
            </button>
            {!preview && (
              <Link to="/" className="button secondary">
                Về trang chủ
              </Link>
            )}
          </div>
        </main>
      ) : (
        <main className="game-playing">
          <div className="game-progress-heading">
            <div>
              <span className="eyebrow">
                VÒNG {index + 1} / {total}
              </span>
              <h1>{round.title || game.title}</h1>
            </div>
            <div className="game-metrics">
              {game.timerMode !== "none" && (
                <span
                  className={
                    game.timerMode === "limit" && game.timeLimit - elapsed < 30
                      ? "urgent"
                      : ""
                  }
                >
                  <Timer size={20} />
                  {timeText(
                    game.timerMode === "limit"
                      ? game.timeLimit - elapsed
                      : elapsed,
                  )}
                </span>
              )}
              {game.scoreEnabled && (
                <span>
                  <Star size={20} />
                  {score}
                </span>
              )}
            </div>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Tiến độ trò chơi"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          <PuzzleBoard
            key={round.id}
            round={round}
            locked={phase !== "playing"}
            onWrong={() => {
              if (phaseRef.current !== "playing") return;
              setMistakes((v) => v + 1);
            }}
            onCorrect={(n) => {
              setPlaced(n);
              tone();
            }}
            onComplete={finishRound}
          />
          {phase === "roundComplete" && (
            <section className="round-success" role="status">
              <span className="circle-icon">
                <Check />
              </span>
              <div>
                <h2>Chính xác!</h2>
                <p>
                  {round.completionMessage ||
                    "Bạn đã khám phá thêm một bức ảnh bí mật."}
                </p>
              </div>
              <button
                className="button primary"
                onClick={() => {
                  if (index === total - 1) {
                    setPhase("done");
                    phaseRef.current = "done";
                  } else {
                    setIndex((i) => i + 1);
                    setPlaced(0);
                    setPhase("playing");
                    phaseRef.current = "playing";
                  }
                }}
              >
                {index === total - 1 ? "Xem kết quả" : "Vòng tiếp theo"}
                <ArrowRight size={19} />
              </button>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
