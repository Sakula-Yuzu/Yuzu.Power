import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

type Mode = "drain" | "charge";

type Sample = {
  w: number;
  v: number;
  a: number;
  npu: number;
  skin: number;
  bat: number;
  cpu: number;
  cput: number;
};

type Tile = {
  id: string;
  label: string;
  wide?: boolean;
  read: (s: Sample) => string;
};

const tiles: Tile[] = [
  { id: "w", label: "瞬时功率", read: (s) => `${signed(s.w, 2)} W` },
  { id: "cycle", label: "电池循环", read: () => "2 次" },
  { id: "npu", label: "NPU温度", read: (s) => `${s.npu.toFixed(1)} °C` },
  { id: "a", label: "电池电流", read: (s) => `${signed(s.a, 2)} A` },
  { id: "skin", label: "表面温度", read: (s) => `${s.skin.toFixed(1)} °C` },
  { id: "v", label: "电池电压", read: (s) => `${s.v.toFixed(2)} V` },
  { id: "bat", label: "电池温度", read: (s) => `${s.bat.toFixed(0)} °C` },
  { id: "cpu", label: "CPU 占用", read: (s) => `${s.cpu.toFixed(1)}%` },
  { id: "cput", label: "CPU温度", read: (s) => `${s.cput.toFixed(1)} °C` },
  { id: "hz", label: "屏幕刷新率", wide: true, read: () => "144 Hz" },
];

const defaultOn = ["w", "a", "v", "bat", "cpu", "cput", "hz"];

function signed(n: number, digits: number) {
  const text = Math.abs(n).toFixed(digits);
  return n < 0 ? `-${text}` : `+${text}`;
}

function sample(mode: Mode, t: number): Sample {
  if (mode === "drain") {
    const w = -3.1 + Math.sin(t * 0.72) * 0.85 + Math.sin(t * 0.21) * 0.25;
    const v = 4.02 + Math.sin(t * 0.31) * 0.03;
    return {
      w,
      v,
      a: w / v,
      npu: 46.8 + Math.sin(t * 0.15) * 1.2,
      skin: 38.6 + Math.sin(t * 0.12) * 0.6,
      bat: 35.8 + Math.sin(t * 0.1) * 0.4,
      cpu: 18 + (Math.sin(t * 0.9) + 1) * 4,
      cput: 64 + Math.sin(t * 0.2) * 2.2,
    };
  }
  const w = 22.4 + Math.sin(t * 0.48) * 4.2 + Math.sin(t * 0.19) * 0.8;
  const v = 4.28 + Math.sin(t * 0.27) * 0.04;
  return {
    w,
    v,
    a: w / v,
    npu: 41 + Math.sin(t * 0.14) * 0.8,
    skin: 36.2 + Math.sin(t * 0.11) * 0.5,
    bat: 34.4 + Math.sin(t * 0.1) * 0.4,
    cpu: 11 + (Math.sin(t * 0.7) + 1) * 3,
    cput: 48 + Math.sin(t * 0.18) * 1.6,
  };
}

export function PhoneDemo() {
  const [mode, setMode] = useState<Mode>("drain");
  const [on, setOn] = useState<string[]>(defaultOn);
  const [tick, setTick] = useState(0);
  const [history, setHistory] = useState<{ w: number }[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({ w: sample("drain", i * 0.4).w })),
  );
  const [chartOn, setChartOn] = useState(false);

  useEffect(() => {
    setChartOn(true);
    try {
      const saved = window.localStorage.getItem("yuzu-tiles");
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          const known = parsed.filter((id) => tiles.some((tile) => tile.id === id));
          if (known.length > 0) setOn(known);
        }
      }
    } catch {
      /* ignore broken local storage */
    }
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 700);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const next = sample(mode, tick * 0.7);
    setHistory((prev) => [...prev.slice(-23), { w: next.w }]);
  }, [tick, mode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("yuzu-tiles", JSON.stringify(on));
    } catch {
      /* storage may be blocked */
    }
  }, [on]);

  const now = sample(mode, tick * 0.7);
  const visible = tiles.filter((tile) => on.includes(tile.id));

  function toggle(id: string) {
    setOn((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setHistory(Array.from({ length: 24 }, (_, i) => ({ w: sample(next, i * 0.4).w })));
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-4xl bg-ink p-3 text-paper shadow-xl shadow-ink/20">
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-paper/25" />
        <div className="flex items-center justify-between px-2 text-xs text-paper/70">
          <span className="tabular-nums">21:48</span>
          <span>演示</span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3 px-2">
          <div>
            <p className="font-display text-lg leading-none">Yuzu.Power</p>
            <p className="mt-2 text-sm text-paper/75">
              状态：{mode === "drain" ? "放电中" : "充电中"}
            </p>
          </div>
          <p className="text-sm text-paper/70">1.9.0</p>
        </div>
        <div className="mt-4 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto px-1 pb-1">
          {visible.map((tile) => (
            <div
              key={tile.id}
              className={`rounded-2xl border border-paper/10 bg-paper/10 px-3 py-3 ${tile.wide ? "col-span-2" : ""}`}
            >
              <p className="text-xs text-paper/70">{tile.label}</p>
              <p className="mt-1 text-xl font-medium tabular-nums tracking-tight">{tile.read(now)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 h-24 px-1">
          {chartOn ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <YAxis hide domain={["auto", "auto"]} />
                <Area
                  type="monotone"
                  dataKey="w"
                  stroke="currentColor"
                  fill="currentColor"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-xl bg-paper/10" />
          )}
        </div>
        <p className="px-2 pt-1 text-xs text-paper/60">功率曲线 · 浏览器演示数据，不会读取本机电池</p>
      </div>

      <div className="mt-4 flex gap-2" role="group" aria-label="充放电状态">
        <ModeButton active={mode === "drain"} onClick={() => switchMode("drain")}>
          放电
        </ModeButton>
        <ModeButton active={mode === "charge"} onClick={() => switchMode("charge")}>
          充电
        </ModeButton>
      </div>
      <p className="mt-4 text-sm text-muted">点选下列名称，可增删主界面组件。请至少保留一项。</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tiles.map((tile) => {
          const active = on.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(tile.id)}
              className={`min-h-11 rounded-full border px-3 text-sm transition-colors duration-200 ${
                active
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line bg-card text-ink hover:border-accent"
              }`}
            >
              {tile.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-full border text-sm font-medium transition-colors duration-200 ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink"
      }`}
    >
      {children}
    </button>
  );
}
