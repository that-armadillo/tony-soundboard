import React, { useEffect, useRef, useState } from "react";

interface CSSVars extends React.CSSProperties {
  "--tile"?: string;
  "--tile-2"?: string;
  "--glow"?: string;
}

// 👉 Put your .mp3/.wav files in /public/sounds
// These are the clips you've been using; adjust labels/filenames as needed
const SAMPLES: { id: string; label: string; src: string }[] = [
  { id: "lugnt", label: "Amen de e lugnt", src: "/sounds/amen-de-e-lugnt.mp3" },
  { id: "du", label: "De e du ju", src: "/sounds/de-e-du-ju.mp3" },
  { id: "groggdags", label: "Det är groggdags", src: "/sounds/det-ar-groggdags.mp3" },
  { id: "helvete", label: "Far åt helvete", src: "/sounds/far-at-helvete.mp3" },
  { id: "gris", label: "Grisajävel", src: "/sounds/grisajavel.mp3" },
  { id: "vakna", label: "Jonas vakna!", src: "/sounds/jonas-vakna.mp3" },
  { id: "luffare", label: "Luffarjävel", src: "/sounds/luffarjavel.mp3" },
  { id: "tack", label: "Tack", src: "/sounds/tack.mp3" },
  { id: "tommen", label: "Tommen opp", src: "/sounds/tommen-opp.mp3" },
  { id: "tony", label: "Tony!", src: "/sounds/tony.mp3" },
  { id: "klunka", label: "Nån skrev klunka", src: "/sounds/skrev-klunka.mp3" },
  { id: "vrala", label: "Sitta å vråla", src: "/sounds/sitta-a-vrala.mp3" },
];

const PALETTES: Array<[string, string]> = [
  ["#1d4ed8", "#2653de"],
  ["#16a34a", "#0e7a35"],
  ["#e11d48", "#b81a3c"],
  ["#a855f7", "#7c3aed"],
  ["#f59e0b", "#d97706"],
  ["#06b6d4", "#0ea5b7"],
  ["#ef4444", "#dc2626"],
];

const STYLES = `
/* --- Soundboard styles (inlined, polished) --- */
:root {
  --bg: #0f1115;
  --muted: #a5b0c1;
  --text: #e6e9ef;
  --panel: #161a22;
  --ring: rgba(255,255,255,0.5);
  --tile: #1d4ed8;
  --tile-2: #2653de;
}

html, body, #root { height: 100%; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial;
  color: var(--text);
  background: radial-gradient(1200px 800px at 20% -10%, #1b2230 0%, #0f1115 40%, #0b0d12 100%);
}

/* Layout */
.sb-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 28px;
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

/* Header */
.sb-header { text-align: center; margin-bottom: 10px; }
.sb-header h1 {
  margin: 14px 0 6px;
  font-weight: 900;
  font-size: clamp(32px, 6vw, 56px);
  letter-spacing: 0.4px;
  line-height: 1.05;
  background: linear-gradient(180deg, #fff, #c9d6ff 70%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tagline { color: var(--muted); margin: 0; font-size: 14px; }

/* Grid */
.sb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px;
  margin: 28px auto 34px;
  width: min(100%, 900px);
}

/* Tiles */
.sb-btn {
  position: relative;
  -webkit-tap-highlight-color: transparent;
  appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  border: 0;
  border-radius: 16px;
  padding: 22px 18px;
  min-height: 110px;
  display: grid; place-items: center; text-align: center;
  font-size: 16px; font-weight: 900; letter-spacing: 0.2px;
  color: #fff; cursor: pointer;
  background: linear-gradient(180deg, var(--tile, #1d4ed8), var(--tile-2, #2653de));
  box-shadow: 0 14px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
  transition: transform .06s ease, box-shadow .2s ease, filter .2s ease;
}
.sb-btn::before {
  content: "";
  position: absolute; inset: 0; border-radius: 16px; pointer-events: none;
  background: radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,0.25), rgba(255,255,255,0) 50%);
}
.sb-btn::after {
  content: "";
  position: absolute; inset: 0; border-radius: 16px; pointer-events: none;
  background: rgba(0,0,0,0.14);
  opacity: 0;
  transition: opacity .15s ease;
}
.sb-btn:hover { transform: translateY(-1px); }
.sb-btn:hover::before { opacity: 0; }
.sb-btn:hover::after { opacity: 1; }
.sb-btn:active { transform: translateY(1px) scale(0.995); }
.sb-btn:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
.sb-btn-label { text-wrap: balance; }
.sb-btn[data-active="true"] {
  box-shadow:
    0 0 0 3px rgba(255,255,255,0.08),
    0 0 24px 6px color-mix(in srgb, var(--glow, #ffffff), transparent 65%),
    0 18px 36px rgba(0,0,0,0.45);
  filter: brightness(1.03) saturate(1.02);
}

/* Footer */
.footer { text-align: center; color: var(--muted); padding: 16px 0 6px; }

/* Motion respect */
@media (prefers-reduced-motion: reduce) {
  .sb-btn { transition: none; }
}
`;

export default function App() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const playersRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Preload one Audio instance per sample and wire listeners
  useEffect(() => {
    SAMPLES.forEach((s) => {
      const existing = playersRef.current.get(s.id);
      if (existing) return;
      const a = new Audio(s.src);
      a.preload = "auto";
      a.addEventListener("error", () => {
        const mediaError: MediaError | null = a.error;
        console.warn("Audio tag error", { src: s.src, code: mediaError?.code });
      });
      a.addEventListener("stalled", () => {
        console.warn("Audio stalled", { src: s.src });
      });
      a.addEventListener("play", () => {
        setActive(new Set([s.id]));
      });
      a.addEventListener("ended", () => {
        setActive((prev) => {
          const next = new Set(prev);
          next.delete(s.id);
          return next;
        });
      });
      playersRef.current.set(s.id, a);
    });
  }, []);

  // Title + emoji favicon
  useEffect(() => {
    if (document.title !== "Tony!") document.title = "Tony!";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='52'>👍</text></svg>`;
    const href = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = href;
  }, []);

  function play(src: string, id: string) {
    let a = playersRef.current.get(id);
    if (!a) {
      a = new Audio(src);
      a.preload = "auto";
      a.addEventListener("play", () => setActive(new Set([id])));
      a.addEventListener("ended", () => setActive((prev) => { const n = new Set(prev); n.delete(id); return n; }));
      playersRef.current.set(id, a);
    }
    try {
      // Single-playback: stop all others
      playersRef.current.forEach((p, key) => {
        if (key !== id) { try { p.pause(); } catch {} try { p.currentTime = 0; } catch {} }
      });
      a.pause();
      a.currentTime = 0;
      void a.play();
      setActive(new Set([id]));
    } catch (err) {
      console.warn("Audio play failed:", err);
    }
  }

  return (
    <main className="sb-wrap">
      <style>{STYLES}</style>
      <header className="sb-header">
        <h1>TONY!</h1>
        <p className="tagline">Nu kan även du gå live på Instagram</p>
      </header>

      <section className="sb-grid" aria-label="soundboard">
        {SAMPLES.map((s, idx) => {
          const styleVars: CSSVars = {
            "--tile": PALETTES[idx % PALETTES.length][0],
            "--tile-2": PALETTES[idx % PALETTES.length][1],
            "--glow": PALETTES[idx % PALETTES.length][0],
          };
          return (
            <button
              key={s.id}
              className="sb-btn"
              onClick={() => play(s.src, s.id)}
              aria-label={`Play ${s.label}`}
              data-active={active.has(s.id)}
              style={styleVars}
            >
              <span className="sb-btn-label">{s.label}</span>
            </button>
          );
        })}
      </section>

      <footer className="footer">
        <small>Made by Jonas • {new Date().getFullYear()}</small>
      </footer>
    </main>
  );
}