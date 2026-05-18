import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Timer,
  Activity,
  TrendingUp,
  RefreshCw,
  Shuffle,
  Copy,
  Check,
} from "lucide-react";
import type {
  PasswordStrengthResult,
  BenchmarkResult,
  WasmModule,
  BenchmarkStats,
} from "@/types/password";
import ThemeToggle from "./ThemeToggle";
import { loadPasswordWasm } from "@/utils/wasmLoader";
import { analyzePasswordJS } from "@/utils/passwordAnalysis";

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

const SectionHeader = ({ index, title }: { index: string; title: string }) => (
  <div className="flex items-center gap-3 mb-8 overflow-hidden">
    <span className="font-heading dark:font-mono text-[10px] text-main tracking-[0.3em] uppercase shrink-0 glow-red">
      [ {index} ]
    </span>
    <span className="font-heading dark:font-mono text-[10px] tracking-[0.3em] uppercase text-foreground/50 shrink-0">
      {title}
    </span>
    <div className="flex-1 border-t border-border/20" />
    <span className="font-mono text-[10px] text-foreground/15 tracking-wider shrink-0 hidden sm:block select-none">
      //////////
    </span>
  </div>
);

// ─── DATA ROW ─────────────────────────────────────────────────────────────────

const DataRow = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) => (
  <div className="border-b border-border/20 py-3 grid grid-cols-[1fr_auto] gap-4 items-baseline">
    <div className="min-w-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 dark:font-mono">
        {label}
      </span>
      {note && (
        <p className="text-[10px] text-foreground/25 mt-0.5 leading-snug italic dark:not-italic dark:font-mono dark:tracking-wide">
          {note}
        </p>
      )}
    </div>
    <span className="font-heading dark:font-mono dark:text-xs text-sm shrink-0">
      {value}
    </span>
  </div>
);

// ─── STRENGTH CONFIG ──────────────────────────────────────────────────────────

const strengthConfig: Record<
  string,
  { label: string; bg: string; text: string; bar: string }
> = {
  "Very Weak": { label: "VERY WEAK",   bg: "bg-[#E61919]",        text: "text-white",      bar: "#E61919" },
  Weak:        { label: "WEAK",        bg: "bg-[#E61919]/80",     text: "text-white",      bar: "#E61919CC" },
  Fair:        { label: "FAIR",        bg: "bg-[#FFB02D]",        text: "text-black",      bar: "#FFB02D" },
  Strong:      { label: "STRONG",      bg: "bg-foreground",       text: "text-background", bar: "currentColor" },
  "Very Strong": { label: "VERY STRONG", bg: "bg-foreground",     text: "text-background", bar: "currentColor" },
};

// ─── STRENGTH PANEL ───────────────────────────────────────────────────────────

const StrengthPanel = ({
  primary,
  jsScore,
  wasmScore,
  implementationLabel,
}: {
  primary: PasswordStrengthResult;
  jsScore: number | null;
  wasmScore: number | null;
  implementationLabel: string;
}) => {
  const cfg = strengthConfig[primary.strength_level] ?? strengthConfig["Fair"];
  const scorePercent = (primary.score / primary.max_score) * 100;
  const implementationsAgree =
    jsScore !== null && wasmScore !== null && jsScore === wasmScore;

  return (
    <div className="border-2 border-border bg-secondary-background shadow-shadow">
      <div className="border-b-2 border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <span className="font-heading dark:font-mono text-[10px] tracking-[0.2em] uppercase">
          Strength Analysis
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-foreground/30 shrink-0">
          {implementationLabel}
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start">
          <div
            className={`${cfg.bg} ${cfg.text} px-6 py-5 flex flex-col items-center justify-center sm:min-w-40`}
          >
            <span className="font-heading text-2xl tracking-widest leading-tight">
              {cfg.label}
            </span>
            <span className="font-heading text-5xl mt-1 leading-none">
              {primary.score}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-1">
              / {primary.max_score}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2 gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 dark:font-mono">
                    Score Composition
                  </span>
                  <p className="text-[10px] italic text-foreground/25 mt-0.5 leading-snug dark:not-italic dark:font-mono">
                    Entropy × variety − pattern penalties
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40 shrink-0">
                  {scorePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-4 border-2 border-border bg-background overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${scorePercent}%`,
                    backgroundColor: cfg.bar === "currentColor" ? "var(--color-foreground)" : cfg.bar,
                  }}
                />
              </div>
            </div>

            <DataRow
              label="Entropy"
              value={`${primary.entropy.toFixed(1)} bits`}
              note="Each +1 bit doubles the guessing difficulty."
            />
            <DataRow
              label="Time to crack"
              value={primary.time_to_crack}
              note="Brute-force @ 1 billion guesses/sec."
            />
          </div>
        </div>

        {primary.feedback &&
          !primary.feedback.startsWith("Great") &&
          !primary.feedback.startsWith("Excellent") &&
          !primary.feedback.startsWith("Good password") && (
            <div className="border-l-4 border-main pl-4 py-1">
              <p className="text-xs leading-relaxed text-foreground/70 dark:font-mono dark:text-[11px]">
                {primary.feedback}
              </p>
            </div>
          )}

        <div className="flex items-center gap-3 border-t-2 border-border pt-4">
          <div
            className={`w-2 h-2 shrink-0 glow-green ${
              implementationsAgree ? "bg-terminal-green" : "bg-main"
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
            {jsScore !== null && wasmScore !== null
              ? implementationsAgree
                ? `JS and WASM agree — both scored ${primary.score}/100`
                : `JS scored ${jsScore}/100 · WASM scored ${wasmScore}/100`
              : "Awaiting analysis"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const PasswordPerformance: React.FC = () => {
  const [password, setPassword] = useState("MySecurePassword123!");
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [wasmResult, setWasmResult] = useState<PasswordStrengthResult | null>(null);
  const [jsResult, setJsResult] = useState<PasswordStrengthResult | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  useEffect(() => {
    const initWasm = async () => {
      setLoading(true);
      try {
        const wasm = await loadPasswordWasm();
        setWasmModule(wasm);
        setWasmLoaded(true);
      } catch (err) {
        setError("Failed to load WebAssembly module");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initWasm();
  }, []);

  const implementationName = wasmLoaded ? "Rust WebAssembly" : "JavaScript (Fallback)";

  const removeOutliers = useCallback((times: number[]): number[] => {
    if (times.length < 4) return times;
    const sorted = [...times].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    return sorted.filter(
      (t) => t >= q1 - 1.5 * iqr && t <= q3 + 1.5 * iqr
    );
  }, []);

  const calculateStatistics = useCallback(
    (times: number[]): BenchmarkStats => {
      const filtered = removeOutliers(times);
      const mean = filtered.reduce((s, t) => s + t, 0) / filtered.length;
      return {
        mean,
        median: filtered[Math.floor(filtered.length / 2)],
        min: Math.min(...filtered),
        max: Math.max(...filtered),
        count: filtered.length,
        outliers: times.length - filtered.length,
      };
    },
    [removeOutliers]
  );

  const runHighPrecisionBenchmark = useCallback(
    async (fn: () => void, iterations: number, rounds = 10): Promise<number[]> => {
      const times: number[] = [];
      for (let round = 0; round < rounds; round++) {
        if (window.gc) window.gc();
        await new Promise((r) => setTimeout(r, 5));
        const start = performance.now();
        for (let i = 0; i < iterations; i++) fn();
        times.push(performance.now() - start);
      }
      return times;
    },
    []
  );

  const analyzePassword = useCallback(async () => {
    if (!wasmModule) return;
    try {
      const jsRes = analyzePasswordJS(password);
      const wasmRes = wasmModule.analyze_password_strength(password);
      setJsResult(jsRes);
      setWasmResult(wasmRes);

      const baseIterations = 5000;
      const iterations = Math.max(
        baseIterations,
        Math.min(50000, baseIterations * (20 / Math.max(password.length, 1)))
      );
      const rounds = 15;
      const warmupRounds = 5;

      for (let i = 0; i < warmupRounds; i++) {
        for (let j = 0; j < Math.min(2000, iterations / 2); j++)
          analyzePasswordJS(password);
        wasmModule.benchmark_password_analysis(password, Math.min(2000, iterations / 2));
        await new Promise((r) => setTimeout(r, 10));
      }

      const jsTimes = await runHighPrecisionBenchmark(
        () => analyzePasswordJS(password),
        iterations,
        rounds
      );

      const wasmTimes: number[] = [];
      for (let round = 0; round < rounds; round++) {
        if (window.gc) window.gc();
        await new Promise((r) => setTimeout(r, 5));
        wasmTimes.push(wasmModule.benchmark_password_analysis(password, iterations));
      }

      const jsStats = calculateStatistics(jsTimes);
      const wasmStats = calculateStatistics(wasmTimes);

      setBenchmark({
        jsTime: jsStats.median,
        wasmTime: wasmStats.median,
        jsPerCallUs: (jsStats.median / iterations) * 1000,
        wasmPerCallUs: (wasmStats.median / iterations) * 1000,
        speedup: wasmStats.median > 0 ? jsStats.median / wasmStats.median : 1,
        iterations,
        jsStats,
        wasmStats,
      });
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Password analysis failed");
    }
  }, [wasmModule, password, calculateStatistics, runHighPrecisionBenchmark]);

  useEffect(() => {
    if (wasmModule && password) analyzePassword();
  }, [wasmModule, password, analyzePassword]);

  const generateRandomPassword = useCallback(() => {
    const charset = [
      genLower  ? "abcdefghijklmnopqrstuvwxyz" : "",
      genUpper  ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
      genDigits ? "0123456789" : "",
      genSymbols ? "!@#$%^&*()_+-=[]{}|;:,.<>?" : "",
    ].join("");
    if (!charset) return;
    const bytes = new Uint8Array(genLength * 2);
    crypto.getRandomValues(bytes);
    const maxValid = 256 - (256 % charset.length);
    const result: string[] = [];
    for (const byte of bytes) {
      if (byte < maxValid && result.length < genLength)
        result.push(charset[byte % charset.length]);
    }
    setPassword(result.join(""));
  }, [genLength, genLower, genUpper, genDigits, genSymbols]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  const examplePasswords = [
    "password123",
    "MyStr0ng!P@ssw0rd",
    "abcd1234",
    "SuperSecure2024!",
    "qwerty",
    "Tr0ub4dor&3",
    "correcthorsebatterystaple",
    "P@ssw0rd!2024#Secure",
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="border-b-2 border-border">
        <div className="border-b border-border/30 px-4 sm:px-8 py-2 flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/30">
            [ THE DASH ] · UNIT/PWD-01 · REV&nbsp;2.6
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-foreground/20">
              {wasmLoaded ? (
                <span className="text-terminal-green glow-green">● WASM ACTIVE</span>
              ) : (
                <span className="text-foreground/20">○ JS MODE</span>
              )}
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div className="px-4 sm:px-8 pt-8 pb-6 max-w-screen-xl mx-auto">
          <div className="border-l-4 border-main pl-4 sm:pl-6 mb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-main/80 mb-1 glow-red">
              PERFORMANCE LAB
            </p>
            <h1
              className="font-heading uppercase leading-none tracking-tighter text-foreground"
              style={{ fontSize: "clamp(3.5rem, 13vw, 10rem)", letterSpacing: "-0.04em" }}
            >
              PASSWORD
            </h1>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/30">
              JAVASCRIPT VS RUST WEBASSEMBLY · BROWSER SANDBOX BENCHMARKING
            </p>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-foreground/15 tracking-widest select-none">
              ///////////////////
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-8 py-10 space-y-14">

        {/* ── 01: INPUT ───────────────────────────────────────────────────── */}
        <section>
          <SectionHeader index="01" title="Input" />

          <div className="border-2 border-border bg-secondary-background shadow-shadow">

            {/* Password field */}
            <div className="border-b-2 border-border p-4 sm:p-6">
              <label
                htmlFor="password-input"
                className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40 block mb-2"
              >
                [ PASSWORD ]
              </label>
              <div className="flex gap-2 min-w-0">
                <input
                  id="password-input"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-3 border-2 border-border bg-background text-foreground font-heading dark:font-mono text-base sm:text-lg placeholder-foreground/30 focus:border-main outline-none transition-colors"
                  placeholder="Enter password to analyze..."
                />
                <button
                  onClick={copyToClipboard}
                  aria-label="Copy to clipboard"
                  className="shrink-0 w-12 h-12 border-2 border-border bg-background hover:bg-secondary-background flex items-center justify-center transition-colors"
                >
                  {copied ? (
                    <Check size={15} className="text-main" />
                  ) : (
                    <Copy size={15} className="text-foreground/60" />
                  )}
                </button>
              </div>
            </div>

            {/* Generator */}
            <div className="border-b-2 border-border p-4 sm:p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40 block mb-4">
                [ GENERATE RANDOM ]
              </span>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                    LEN
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={64}
                    value={genLength}
                    onChange={(e) =>
                      setGenLength(Math.max(6, Math.min(64, Number(e.target.value))))
                    }
                    className="w-14 px-2 py-1.5 border-2 border-border bg-background text-foreground font-mono text-sm text-center outline-none focus:border-main transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "A–Z", value: genUpper, setter: setGenUpper },
                    { label: "a–z", value: genLower, setter: setGenLower },
                    { label: "0–9", value: genDigits, setter: setGenDigits },
                    { label: "!@#", value: genSymbols, setter: setGenSymbols },
                  ].map(({ label, value, setter }) => (
                    <button
                      key={label}
                      onClick={() => setter((v) => !v)}
                      className={`px-3 py-1.5 border-2 border-border font-mono text-[11px] uppercase tracking-wider transition-colors ${
                        value ? "bg-main text-white" : "bg-background text-foreground/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={generateRandomPassword}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-border bg-foreground text-background font-mono text-[11px] uppercase tracking-widest hover:bg-main hover:border-main transition-colors ml-auto"
                >
                  <Shuffle size={12} />
                  Generate
                </button>
              </div>
            </div>

            {/* Example passwords */}
            <div className="p-4 sm:p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/30 block mb-3">
                [ TRY THESE ]&nbsp;›
              </span>
              <div className="flex flex-wrap gap-2">
                {examplePasswords.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPassword(example)}
                    className="px-3 py-1.5 border border-border/50 bg-background hover:border-main hover:text-main font-mono text-[11px] uppercase tracking-wide transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {(error || loading) && (
              <div className="border-t-2 border-border px-4 sm:px-6 py-3">
                {error && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-main">
                    ⚠ {error}
                  </p>
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-foreground/40">
                    <RefreshCw size={12} className="animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">
                      Loading WebAssembly module...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── 02: BENCHMARK ───────────────────────────────────────────────── */}
        {benchmark && (
          <section>
            <SectionHeader index="02" title="Performance Benchmark" />

            <div className="space-y-px border-2 border-border bg-border shadow-shadow">

              {/* Methodology explanation */}
              <div className="bg-background px-4 sm:px-6 py-4 border-b border-border/20">
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 items-start">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-main shrink-0 glow-red">
                    [ WHAT IS MEASURED ]
                  </span>
                  <p className="font-mono text-[11px] text-foreground/50 leading-relaxed">
                    Both implementations run the <span className="text-foreground/80">full analysis pipeline</span> — score,
                    strength classification, entropy, time-to-crack, and feedback — exactly{" "}
                    <span className="text-foreground/80">{benchmark.iterations.toLocaleString()} times</span> in a batch.
                    The timer wraps the entire batch. Reported time is the{" "}
                    <span className="text-foreground/80">median of 15 rounds</span> with outliers removed via IQR.
                    WASM timing runs inside the binary to exclude JS↔WASM call overhead.
                  </p>
                </div>
              </div>

              {/* Per-call latency — primary metric */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
                {[
                  {
                    icon: <Timer size={14} />,
                    label: "JavaScript",
                    tag: "V8 / SpiderMonkey",
                    value: benchmark.jsPerCallUs < 10
                      ? `${benchmark.jsPerCallUs.toFixed(2)}µs`
                      : `${benchmark.jsPerCallUs.toFixed(1)}µs`,
                    sub: "per analysis call",
                    note: `${benchmark.jsTime.toFixed(2)}ms total · ${benchmark.iterations.toLocaleString()} calls`,
                    highlight: false,
                  },
                  {
                    icon: <Zap size={14} />,
                    label: "Rust / WASM",
                    tag: "Compiled Binary",
                    value: benchmark.wasmPerCallUs < 10
                      ? `${benchmark.wasmPerCallUs.toFixed(2)}µs`
                      : `${benchmark.wasmPerCallUs.toFixed(1)}µs`,
                    sub: "per analysis call",
                    note: `${benchmark.wasmTime.toFixed(2)}ms total · ${benchmark.iterations.toLocaleString()} calls`,
                    highlight: false,
                  },
                  {
                    icon: <TrendingUp size={14} />,
                    label: "Speedup",
                    tag: benchmark.speedup > 1 ? "WASM FASTER" : "JS FASTER",
                    value: `${benchmark.speedup.toFixed(2)}×`,
                    sub: benchmark.speedup > 1 ? "WASM wins" : "JS wins",
                    note: "Ratio of median batch times",
                    highlight: true,
                  },
                ].map(({ icon, label, tag, value, sub, note, highlight }) => (
                  <div
                    key={label}
                    className={`p-5 sm:p-6 flex flex-col gap-3 ${
                      highlight ? "bg-main text-white" : "bg-secondary-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 opacity-50">
                        {icon}
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                          {label}
                        </span>
                      </div>
                      <span className={`font-mono text-[9px] uppercase tracking-widest ${highlight ? "opacity-60" : "text-foreground/20"}`}>
                        {tag}
                      </span>
                    </div>
                    <div
                      className="font-heading leading-none"
                      style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
                    >
                      {value}
                    </div>
                    <div>
                      <div className={`font-mono text-[10px] uppercase tracking-[0.15em] ${highlight ? "opacity-70" : "text-foreground/40"}`}>
                        {sub}
                      </div>
                      <div className={`font-mono text-[10px] mt-0.5 leading-snug ${highlight ? "opacity-50" : "text-foreground/25"}`}>
                        {note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Why it matters */}
              <div className="bg-background px-4 sm:px-6 py-4 border-t border-border/20">
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 items-start">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/30 shrink-0">
                    [ WHY IT MATTERS ]
                  </span>
                  <p className="font-mono text-[11px] text-foreground/40 leading-relaxed">
                    WASM runs pre-compiled machine code — no JIT warmup, no garbage collection pauses.
                    JS relies on the browser's JIT compiler, which is excellent but introduces
                    unpredictability. At scale (e.g., validating thousands of passwords server-side
                    via a WASM runtime), even a 1.5× difference compounds significantly.
                    The per-call µs figure is the actionable number.
                  </p>
                </div>
              </div>

              {/* Visual comparison bars */}
              <div className="bg-secondary-background p-4 sm:p-6 space-y-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40 block">
                    [ RELATIVE THROUGHPUT ]
                  </span>
                  <p className="font-mono text-[10px] text-foreground/20 mt-0.5">
                    Shorter bar = faster. Scaled to slowest. Batch median across {benchmark.iterations.toLocaleString()} iterations.
                  </p>
                </div>
                {(() => {
                  const maxTime = Math.max(benchmark.jsTime, benchmark.wasmTime);
                  return (
                    <div className="space-y-3">
                      {[
                        { label: "JS",   time: benchmark.jsTime,   perCall: benchmark.jsPerCallUs,   color: "bg-foreground" },
                        { label: "WASM", time: benchmark.wasmTime, perCall: benchmark.wasmPerCallUs, color: "bg-main" },
                      ].map(({ label, time, perCall, color }) => (
                        <div key={label} className="flex items-center gap-3 sm:gap-4">
                          <span className="font-mono text-[10px] uppercase tracking-widest w-10 shrink-0 text-foreground/40">
                            {label}
                          </span>
                          <div className="flex-1 h-6 bg-background border border-border/40 overflow-hidden min-w-0">
                            <div
                              className={`h-full ${color} transition-all duration-700`}
                              style={{ width: `${(time / maxTime) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] w-24 text-right shrink-0 text-foreground/60">
                            {perCall < 10 ? perCall.toFixed(2) : perCall.toFixed(1)}µs/call
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* ── 03: STATISTICAL DETAIL ──────────────────────────────────────── */}
        {benchmark?.jsStats && benchmark?.wasmStats && (
          <section>
            <SectionHeader index="03" title="Statistical Detail" />

            <div className="space-y-px border-2 border-border bg-border shadow-shadow">
              {/* 2-col stat panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
                {[
                  { title: "JavaScript",      icon: <Timer size={13} />,    stats: benchmark.jsStats },
                  { title: "Rust WebAssembly", icon: <Activity size={13} />, stats: benchmark.wasmStats },
                ].map(({ title, icon, stats }) => {
                  const consistency =
                    100 - ((stats.max - stats.min) / stats.mean) * 100;
                  return (
                    <div key={title} className="bg-secondary-background">
                      <div className="border-b border-border/30 px-4 sm:px-6 py-3 flex items-center gap-2">
                        <span className="text-foreground/40">{icon}</span>
                        <span className="font-heading dark:font-mono text-[10px] uppercase tracking-[0.25em]">
                          {title}
                        </span>
                      </div>
                      <div className="px-4 sm:px-6 pb-4">
                        <DataRow
                          label="Median (batch)"
                          value={`${stats.median.toFixed(3)}ms`}
                          note={`Per call: ${((stats.median / benchmark.iterations) * 1000).toFixed(3)}µs — most outlier-resistant.`}
                        />
                        <DataRow
                          label="Mean (batch)"
                          value={`${stats.mean.toFixed(3)}ms`}
                          note={`Per call: ${((stats.mean / benchmark.iterations) * 1000).toFixed(3)}µs — average across all valid rounds.`}
                        />
                        <DataRow
                          label="Min (batch)"
                          value={`${stats.min.toFixed(3)}ms`}
                          note={`Per call: ${((stats.min / benchmark.iterations) * 1000).toFixed(3)}µs — best-case (CPU uncontested).`}
                        />
                        <DataRow
                          label="Max (batch)"
                          value={`${stats.max.toFixed(3)}ms`}
                          note={`Per call: ${((stats.max / benchmark.iterations) * 1000).toFixed(3)}µs — worst-case (GC / OS scheduling).`}
                        />
                        <DataRow label="Valid rounds"    value={String(stats.count)}            note="Rounds remaining after IQR outlier removal." />
                        <DataRow label="Outliers removed" value={String(stats.outliers)}        note="Rounds excluded — likely GC pauses or OS preemption." />
                        <DataRow label="Consistency"     value={`${consistency.toFixed(1)}%`}  note="100% = perfectly stable. Lower = more JIT/GC variance." />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confidence footer */}
              <div className="bg-secondary-background px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-foreground/40" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50">
                    [ CONFIDENCE ]
                  </span>
                </div>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                  {[
                    { label: "JS Samples",   value: benchmark.jsStats.count },
                    { label: "WASM Samples", value: benchmark.wasmStats.count },
                    {
                      label: "Rating",
                      value:
                        benchmark.jsStats.count >= 10 && benchmark.wasmStats.count >= 10
                          ? "HIGH"
                          : "MEDIUM",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="font-heading dark:font-mono text-base leading-none">
                        {value}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/30 mt-0.5">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 04: STRENGTH ANALYSIS ───────────────────────────────────────── */}
        {(jsResult || wasmResult) && (
          <section>
            <SectionHeader index="04" title="Strength Analysis" />
            <StrengthPanel
              primary={wasmResult ?? jsResult!}
              jsScore={jsResult?.score ?? null}
              wasmScore={wasmResult?.score ?? null}
              implementationLabel={implementationName}
            />
          </section>
        )}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t-2 border-border mt-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/20">
              © THE DASH
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/15">
              UNIT/PWD-01 · REV 2.6
            </span>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/15">
              JS ENGINE: BROWSER NATIVE
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/15">
              WASM: RUST/WASM-PACK
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PasswordPerformance;

