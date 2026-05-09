import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button";
import {
  Zap,
  Timer,
  Activity,
  TrendingUp,
  RefreshCw,
  Shuffle,
  Copy,
  Check,
  LayoutGrid,
} from "lucide-react";
import type {
  PasswordStrengthResult,
  BenchmarkResult,
  WasmModule,
  BenchmarkStats,
} from "@/types/password";
import ThemeToggle from "./ThemeToggle";
import WidgetDrawer from "./WidgetDrawer";
import { loadPasswordWasm } from "@/utils/wasmLoader";
import { analyzePasswordJS } from "@/utils/passwordAnalysis";

const SectionLabel = ({
  number,
  title,
}: {
  number: string;
  title: string;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="font-heading text-xs text-main tracking-[0.3em] uppercase">
      {number} —
    </span>
    <span className="text-xs tracking-[0.3em] uppercase text-foreground/40">
      {title}
    </span>
    <div className="flex-1 h-px bg-border opacity-20" />
  </div>
);

const strengthConfig: Record<
  string,
  { label: string; color: string; textColor: string; barColor: string }
> = {
  "Very Weak": {
    label: "VERY WEAK",
    color: "bg-[#FF2D2D]",
    textColor: "text-white",
    barColor: "#FF2D2D",
  },
  Weak: {
    label: "WEAK",
    color: "bg-[#FF6B2D]",
    textColor: "text-white",
    barColor: "#FF6B2D",
  },
  Fair: {
    label: "FAIR",
    color: "bg-[#FFB02D]",
    textColor: "text-black",
    barColor: "#FFB02D",
  },
  Strong: {
    label: "STRONG",
    color: "bg-[#2D8FFF]",
    textColor: "text-white",
    barColor: "#2D8FFF",
  },
  "Very Strong": {
    label: "VERY STRONG",
    color: "bg-[#2DCC70]",
    textColor: "text-black",
    barColor: "#2DCC70",
  },
};

const StatRow = ({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) => (
  <div className="border-b border-border/20 py-2.5">
    <div className="flex justify-between items-baseline">
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
        {label}
      </span>
      <span className="font-heading text-sm">{value}</span>
    </div>
    {description && (
      <p className="text-[10px] text-foreground/25 mt-0.5 leading-snug italic">
        {description}
      </p>
    )}
  </div>
);

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
  const config = strengthConfig[primary.strength_level] ?? strengthConfig["Fair"];
  const scorePercent = (primary.score / primary.max_score) * 100;
  const implementationsAgree = jsScore !== null && wasmScore !== null && jsScore === wasmScore;

  return (
    <div className="border-4 border-border shadow-shadow bg-secondary-background">
      <div className="border-b-4 border-border px-6 py-4 flex items-center justify-between">
        <span className="font-heading text-xs tracking-[0.2em] uppercase">
          Strength Analysis
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/30">
          {implementationLabel}
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
          <div
            className={`${config.color} ${config.textColor} px-8 py-6 flex flex-col items-center justify-center min-w-40`}
          >
            <span className="font-heading text-2xl tracking-widest leading-tight">
              {config.label}
            </span>
            <span className="font-heading text-4xl mt-1">{primary.score}</span>
            <span className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
              / {primary.max_score}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Score
                  </span>
                  <p className="text-[10px] italic text-foreground/25 mt-0.5 leading-snug">
                    Entropy × character variety − pattern penalties
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  {scorePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-5 border-2 border-border bg-background overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${scorePercent}%`, backgroundColor: config.barColor }}
                />
              </div>
            </div>

            <div>
              <StatRow
                label="Entropy"
                value={`${primary.entropy.toFixed(1)} bits`}
                description="Randomness of the password. Each +1 bit doubles the guessing difficulty."
              />
              <StatRow
                label="Time to crack"
                value={primary.time_to_crack}
                description="Estimated brute-force time at 1 billion guesses/second."
              />
            </div>
          </div>
        </div>

        {primary.feedback &&
          primary.feedback !== "Great password!" &&
          primary.feedback !== "Excellent password!" &&
          !primary.feedback.startsWith("Good password") && (
            <div className="border-l-4 border-main pl-4 py-1">
              <p className="text-xs leading-relaxed text-foreground/70">
                {primary.feedback}
              </p>
            </div>
          )}

        {implementationsAgree !== null && (
          <div className="flex items-center gap-3 border-t-2 border-border pt-4">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                implementationsAgree ? "bg-[#2DCC70]" : "bg-main"
              }`}
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              {implementationsAgree
                ? `JS and WASM agree — both scored ${primary.score}/100`
                : `JS scored ${jsScore}/100 · WASM scored ${wasmScore}/100`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const PasswordPerformance: React.FC = () => {
  const [password, setPassword] = useState("MySecurePassword123!");
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [wasmResult, setWasmResult] = useState<PasswordStrengthResult | null>(null);
  const [jsResult, setJsResult] = useState<PasswordStrengthResult | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      (time) => time >= q1 - 1.5 * iqr && time <= q3 + 1.5 * iqr
    );
  }, []);

  const calculateStatistics = useCallback(
    (times: number[]): BenchmarkStats => {
      const filtered = removeOutliers(times);
      const mean =
        filtered.reduce((sum, time) => sum + time, 0) / filtered.length;
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
        await new Promise((resolve) => setTimeout(resolve, 5));
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
        wasmModule.benchmark_password_analysis(
          password,
          Math.min(2000, iterations / 2)
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const jsTimes = await runHighPrecisionBenchmark(
        () => analyzePasswordJS(password),
        iterations,
        rounds
      );

      const wasmTimes: number[] = [];
      for (let round = 0; round < rounds; round++) {
        if (window.gc) window.gc();
        await new Promise((resolve) => setTimeout(resolve, 5));
        wasmTimes.push(
          wasmModule.benchmark_password_analysis(password, iterations)
        );
      }

      const jsStats = calculateStatistics(jsTimes);
      const wasmStats = calculateStatistics(wasmTimes);
      const jsTime = jsStats.median;
      const wasmTime = wasmStats.median;

      setBenchmark({
        jsTime,
        wasmTime,
        speedup: wasmTime > 0 ? jsTime / wasmTime : 1,
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
    const charsets = [
      genLower ? "abcdefghijklmnopqrstuvwxyz" : "",
      genUpper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
      genDigits ? "0123456789" : "",
      genSymbols ? "!@#$%^&*()_+-=[]{}|;:,.<>?" : "",
    ].join("");

    if (!charsets) return;

    const bytes = new Uint8Array(genLength * 2);
    crypto.getRandomValues(bytes);
    const maxValid = 256 - (256 % charsets.length);
    const result: string[] = [];
    for (const byte of bytes) {
      if (byte < maxValid && result.length < genLength) {
        result.push(charsets[byte % charsets.length]);
      }
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
      <WidgetDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className="border-b-4 border-border px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-xs text-main tracking-[0.3em] uppercase mb-1">
              01 — The Dash
            </p>
            <h1 className="font-heading text-[clamp(2.5rem,7vw,6rem)] leading-none tracking-tight">
              Password Lab
            </h1>
          </div>
          <div className="flex items-center gap-3 pb-1">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="gap-2 text-xs uppercase tracking-widest"
              aria-label="Open widgets"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Widgets</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
        <section>
          <SectionLabel number="02" title="Input" />
          <div className="border-4 border-border shadow-shadow bg-secondary-background p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-heading text-xs uppercase tracking-[0.2em] text-foreground/50 block"
              >
                Password
              </label>
              <div className="flex gap-2">
                <input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 px-4 py-3 border-4 border-border bg-background text-foreground font-heading text-lg placeholder-foreground/30 focus:border-main outline-none transition-colors"
                  placeholder="Enter password to analyze..."
                />
                <Button
                  variant="neutral"
                  size="icon"
                  onClick={copyToClipboard}
                  aria-label="Copy to clipboard"
                  className="shrink-0 h-auto aspect-square"
                >
                  {copied ? <Check size={16} className="text-main" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="border-2 border-border bg-background p-4 space-y-4">
              <span className="font-heading text-[10px] uppercase tracking-[0.3em] text-foreground/40 block">
                Generate random
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-foreground/40">Length</label>
                  <input
                    type="number"
                    min={6}
                    max={64}
                    value={genLength}
                    onChange={(e) => setGenLength(Math.max(6, Math.min(64, Number(e.target.value))))}
                    className="w-14 px-2 py-1 border-2 border-border bg-secondary-background text-foreground font-heading text-sm text-center outline-none focus:border-main transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "A–Z", value: genUpper, setter: setGenUpper },
                    { label: "a–z", value: genLower, setter: setGenLower },
                    { label: "0–9", value: genDigits, setter: setGenDigits },
                    { label: "!@#", value: genSymbols, setter: setGenSymbols },
                  ].map(({ label, value, setter }) => (
                    <button
                      key={label}
                      onClick={() => setter((v) => !v)}
                      className={`px-3 py-1 border-2 border-border font-heading text-xs uppercase tracking-wider transition-colors ${
                        value
                          ? "bg-main text-white"
                          : "bg-background text-foreground/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={generateRandomPassword}
                  className="gap-2 text-xs uppercase tracking-widest ml-auto"
                >
                  <Shuffle size={13} />
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-foreground/30">
                Try these —
              </span>
              <div className="flex flex-wrap gap-2">
                {examplePasswords.map((example) => (
                  <Button
                    key={example}
                    variant="neutral"
                    size="sm"
                    onClick={() => setPassword(example)}
                    className="text-xs font-heading tracking-wider uppercase"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <div className="border-l-4 border-main pl-4 py-2">
                <p className="text-xs uppercase tracking-widest text-main">
                  {error}
                </p>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 text-foreground/40">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs uppercase tracking-widest">
                  Loading WebAssembly module...
                </span>
              </div>
            )}
          </div>
        </section>

        {benchmark && (
          <section>
            <SectionLabel number="03" title="Performance Benchmark" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: <Timer size={16} />,
                    label: "JavaScript",
                    value: `${benchmark.jsTime.toFixed(3)}ms`,
                    sub: "median time",
                    description: "Native browser JS engine",
                    highlight: false,
                  },
                  {
                    icon: <Zap size={16} />,
                    label: implementationName,
                    value: `${benchmark.wasmTime.toFixed(3)}ms`,
                    sub: "median time",
                    description: "Compiled Rust in browser sandbox",
                    highlight: false,
                  },
                  {
                    icon: <TrendingUp size={16} />,
                    label: "Speedup",
                    value: `${benchmark.speedup.toFixed(2)}×`,
                    sub: `${benchmark.iterations.toLocaleString()} iterations`,
                    description: "WASM vs JS median · >1× = WASM wins",
                    highlight: benchmark.speedup > 1,
                  },
                ].map(({ icon, label, value, sub, description, highlight }) => (
                  <div
                    key={label}
                    className={`border-4 border-border shadow-shadow p-6 flex flex-col gap-2 ${
                      highlight ? "bg-main text-white" : "bg-secondary-background"
                    }`}
                  >
                    <div className="flex items-center gap-2 opacity-60">
                      {icon}
                      <span className="font-heading text-[10px] uppercase tracking-[0.2em]">
                        {label}
                      </span>
                    </div>
                    <div className="font-heading text-3xl md:text-4xl leading-none">
                      {value}
                    </div>
                    <div
                      className={`text-[10px] uppercase tracking-[0.15em] ${
                        highlight ? "opacity-60" : "text-foreground/30"
                      }`}
                    >
                      {sub}
                    </div>
                    <div
                      className={`text-[10px] italic leading-snug ${
                        highlight ? "opacity-50" : "text-foreground/25"
                      }`}
                    >
                      {description}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-4 border-border bg-secondary-background p-6 space-y-4">
                <div>
                  <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Visual comparison
                  </span>
                  <p className="text-[10px] italic text-foreground/25 mt-0.5">
                    Shorter bar = faster execution. Median across {benchmark.iterations.toLocaleString()} rounds.
                  </p>
                </div>
                {(() => {
                  const maxTime = Math.max(
                    benchmark.jsTime,
                    benchmark.wasmTime
                  );
                  return (
                    <div className="space-y-3">
                      {[
                        {
                          label: "JS",
                          time: benchmark.jsTime,
                          color: "bg-foreground",
                        },
                        {
                          label: "WASM",
                          time: benchmark.wasmTime,
                          color: "bg-main",
                        },
                      ].map(({ label, time, color }) => (
                        <div key={label} className="flex items-center gap-4">
                          <span className="font-heading text-xs uppercase tracking-widest w-10 shrink-0 text-foreground/50">
                            {label}
                          </span>
                          <div className="flex-1 h-8 bg-background border-2 border-border overflow-hidden">
                            <div
                              className={`h-full ${color} transition-all duration-700`}
                              style={{
                                width: `${(time / maxTime) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-heading text-sm w-20 text-right shrink-0">
                            {time.toFixed(3)}ms
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

        {benchmark?.jsStats && benchmark?.wasmStats && (
          <section>
            <SectionLabel number="04" title="Statistical Detail" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "JavaScript",
                  icon: <Timer size={14} />,
                  stats: benchmark.jsStats,
                  consistency:
                    100 -
                    ((benchmark.jsStats.max - benchmark.jsStats.min) /
                      benchmark.jsStats.mean) *
                      100,
                },
                {
                  title: "Rust WebAssembly",
                  icon: <Activity size={14} />,
                  stats: benchmark.wasmStats,
                  consistency:
                    100 -
                    ((benchmark.wasmStats.max - benchmark.wasmStats.min) /
                      benchmark.wasmStats.mean) *
                      100,
                },
              ].map(({ title, icon, stats, consistency }) => (
                <div
                  key={title}
                  className="border-4 border-border shadow-shadow bg-secondary-background"
                >
                  <div className="border-b-4 border-border px-6 py-4 flex items-center gap-2">
                    <span className="text-foreground/40">{icon}</span>
                    <span className="font-heading text-xs uppercase tracking-[0.2em]">
                      {title}
                    </span>
                  </div>
                  <div className="p-6 space-y-0">
                    <StatRow
                      label="Median"
                      value={`${stats.median.toFixed(3)}ms`}
                      description="Middle value after sorting — most resistant to outliers."
                    />
                    <StatRow
                      label="Mean"
                      value={`${stats.mean.toFixed(3)}ms`}
                      description="Average across all valid rounds."
                    />
                    <StatRow label="Min" value={`${stats.min.toFixed(3)}ms`} description="Fastest observed round." />
                    <StatRow label="Max" value={`${stats.max.toFixed(3)}ms`} description="Slowest observed round." />
                    <StatRow
                      label="Valid samples"
                      value={String(stats.count)}
                      description="Rounds remaining after outlier removal."
                    />
                    <StatRow
                      label="Outliers removed"
                      value={String(stats.outliers)}
                      description="Extreme values excluded via IQR method."
                    />
                    <StatRow
                      label="Consistency"
                      value={`${consistency.toFixed(1)}%`}
                      description="Lower spread = more stable. 100% = perfectly consistent."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-4 border-border bg-secondary-background p-6 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Activity size={14} className="text-foreground/40" />
                <span className="font-heading text-xs uppercase tracking-[0.2em] text-foreground/60">
                  Confidence
                </span>
              </div>
              <div className="flex gap-8">
                {[
                  { label: "JS Samples", value: benchmark.jsStats.count, description: "Valid rounds after IQR filter" },
                  { label: "WASM Samples", value: benchmark.wasmStats.count, description: "Valid rounds after IQR filter" },
                  {
                    label: "Rating",
                    value:
                      benchmark.jsStats.count >= 10 &&
                      benchmark.wasmStats.count >= 10
                        ? "HIGH"
                        : "MEDIUM",
                    description: "HIGH = 10+ valid samples per implementation",
                  },
                ].map(({ label, value, description }) => (
                  <div key={label} className="text-right">
                    <div className="font-heading text-lg leading-none">
                      {value}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-foreground/30 mt-0.5">
                      {label}
                    </div>
                    <div className="text-[10px] italic text-foreground/20 mt-0.5 leading-snug">
                      {description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(jsResult || wasmResult) && (
          <section>
            <SectionLabel number="05" title="Strength Analysis" />
            <StrengthPanel
              primary={wasmResult ?? jsResult!}
              jsScore={jsResult?.score ?? null}
              wasmScore={wasmResult?.score ?? null}
              implementationLabel={implementationName}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default PasswordPerformance;
