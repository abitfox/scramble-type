import { useRef, useState } from "react";
import { ScrambleText, type ScrambleTextRef } from "scramble-type";

const BOOT_LINES = [
  "> boot sequence initiated",
  "> establishing secure channel ... OK",
  "> agent workstation online",
];

export function App() {
  const [text, setText] = useState("ACCESS GRANTED");
  const [speed, setSpeed] = useState(24);
  const [delay, setDelay] = useState(0);
  const [churnLo, setChurnLo] = useState(3);
  const [churnHi, setChurnHi] = useState(8);
  const [glyphs, setGlyphs] = useState("!<>-_\\/[]{}=+*^?#%&@$01");
  const [layout, setLayout] = useState<"underlay" | "nbsp" | "none">("underlay");
  const [sound, setSound] = useState(false);
  const [maxChars, setMaxChars] = useState(200);
  const [done, setDone] = useState(false);
  const [stage, setStage] = useState(2); // 开机序列门控演示
  const [runId, setRunId] = useState(0); // 多行重播
  const ref = useRef<ScrambleTextRef>(null);

  const replayAll = () => {
    setDone(false);
    setStage(2);
    setRunId((n) => n + 1);
  };

  return (
    <div className="pg">
      <header className="pg-header">
        <ScrambleText text="SCRAMBLETYPE" className="pg-title" speed={26} />
        <p className="pg-sub">interactive playground · adjust props and watch the decode wave</p>
      </header>

      <section className="pg-panel">
        <h2>Live props</h2>
        <div className="pg-stage">
          <ScrambleText
            ref={ref}
            text={text}
            speed={speed}
            delay={delay}
            churn={[churnLo, churnHi]}
            glyphs={glyphs}
            layout={layout}
            sound={sound}
            maxChars={maxChars}
            onDone={() => setDone(true)}
            className="pg-big"
          />
          <p className="pg-status">{done ? "✔ onDone fired" : "…"}</p>
          <div className="pg-btns">
            <button onClick={() => ref.current?.replay()}>replay()</button>
            <button onClick={() => ref.current?.skip()}>skip()</button>
          </div>
        </div>

        <div className="pg-controls">
          <label>
            text <input value={text} onChange={(e) => { setText(e.target.value); setDone(false); }} />
          </label>
          <label>
            glyphs <input value={glyphs} onChange={(e) => setGlyphs(e.target.value)} />
          </label>
          <label>
            speed {speed}ms
            <input type="range" min={4} max={80} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
          </label>
          <label>
            delay {delay}ms
            <input type="range" min={0} max={2000} step={50} value={delay} onChange={(e) => setDelay(+e.target.value)} />
          </label>
          <label>
            churn {churnLo}–{churnHi}
            <input type="range" min={0} max={20} value={churnLo} onChange={(e) => setChurnLo(Math.min(+e.target.value, churnHi))} />
            <input type="range" min={0} max={20} value={churnHi} onChange={(e) => setChurnHi(Math.max(+e.target.value, churnLo))} />
          </label>
          <label>
            maxChars {maxChars}
            <input type="range" min={0} max={400} step={20} value={maxChars} onChange={(e) => setMaxChars(+e.target.value)} />
          </label>
          <label>
            layout
            <select value={layout} onChange={(e) => setLayout(e.target.value as typeof layout)}>
              <option value="underlay">underlay</option>
              <option value="nbsp">nbsp</option>
              <option value="none">none</option>
            </select>
          </label>
          <label className="pg-check">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> sound
          </label>
        </div>
      </section>

      <section className="pg-panel">
        <h2>Boot sequence gating（active 门控 + 多行错峰）</h2>
        <div className="pg-stage pg-terminal">
          {stage < 2 ? (
            <p className="pg-dim">waiting for stage ≥ 2 …</p>
          ) : (
            <div key={runId}>
              <ScrambleText text="HACKER ENGLISH v2.0 — AGENT WORKSTATION ONLINE" speed={22} className="pg-acc" />
              {BOOT_LINES.map((l, i) => (
                <p key={l}>
                  <ScrambleText text={l} delay={300 + i * 220} speed={20} />
                </p>
              ))}
              <p>
                <ScrambleText text="· 特工代号校验通过 · 中文解码同样稳定 ·" delay={1100} speed={22} sound={sound} />
              </p>
            </div>
          )}
          <div className="pg-btns">
            <button onClick={() => setStage((s) => (s < 2 ? 2 : 1))}>toggle active={stage >= 2 ? "false" : "true"}</button>
            <button onClick={replayAll}>replay all</button>
          </div>
        </div>
      </section>
    </div>
  );
}
