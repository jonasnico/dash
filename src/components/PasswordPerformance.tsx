import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/button";
import {
  ArrowLeft,
  Zap,
  Timer,
  Activity,
  TrendingUp,
  RefreshCw,
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

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-baseline border-b border-border/20 py-2">
    <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
      {label}
    </span>
    <span className="font-heading text-sm">{value}</span>
  </div>
);

const StrengthPanel = ({
  result,
  label,
  accent,
}: {
  result: PasswordStrengthResult;
  label: string;
  accent: string;
}) => {
  const config =
    strengthConfig[result.strength_level] ?? strengthConfig["Fair"];
  const scorePercent = (result.score / result.max_score) * 100;

  return (
    <div className="border-4 border-border shadow-shadow bg-secondary-background flex flex-col">
      <div className="border-b-4 border-border px-6 py-4 flex items-center justify-between">
        <span className="font-heading text-xs tracking-[0.2em] uppercase">
          {label}
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/30">
          {accent}
        </span>
      </div>
      <div className="p-6 flex flex-col gap-5 flex-1">
        <div
          className={`${config.color} ${config.textColor} px-4 py-3 flex items-center justify-between`}
        >
          <span className="font-heading text-lg tracking-widest">
            {config.label}
          </span>
          <span className="font-heading text-sm opacity-70">
            {result.score}/{result.max_score}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Score
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              {scorePercent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-4 border-2 border-border bg-background overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${scorePercent}%`,
                backgroundColor: config.barColor,
              }}
            />
          </div>
        </div>

        <div className="space-y-0">
          <StatRow
            label="Entropy"
            value={`${result.entropy.toFixed(1)} bits`}
          />
          <StatRow label="Time to crack" value={result.time_to_crack} />
        </div>

        {result.feedback !== "Great password!" &&
          result.feedback !== "Excellent password!" && (
            <div className="border-l-4 border-main pl-4 py-1">
              <p className="text-xs leading-relaxed text-foreground/70">
                {result.feedback}
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

const PasswordPerformance: React.FC = () => {
  const [password, setPassword] = useState("MySecurePassword123!");
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [wasmResult, setWasmResult] = useState<PasswordStrengthResult | null>(
    null
  );
  const [jsResult, setJsResult] = useState<PasswordStrengthResult | null>(
    null
  );
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWasm = async () => {
      setLoading(true);
      try {
        const wasm = await loadPasswordWasm();
        setWasmModule(wasm);
      } catch (err) {
        setError("Failed to load WebAssembly module");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initWasm();
  }, []);

  const isUsingWasm =
    wasmResult?.feedback?.includes("WASM") ||
    wasmResult?.feedback?.includes("WebAssembly");
  const implementationName = isUsingWasm
    ? "Rust WebAssembly"
    : "JavaScript (Fallback)";

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
      <header className="border-b-4 border-border px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
          <div className="flex items-end gap-6">
            <Link to="/">
              <Button
                variant="neutral"
                size="sm"
                className="gap-2 text-xs uppercase tracking-widest mb-1"
              >
                <ArrowLeft size={14} />
                Back
              </Button>
            </Link>
            <div>
              <p className="font-heading text-xs text-main tracking-[0.3em] uppercase mb-1">
                02 — Performance Lab
              </p>
              <h1 className="font-heading text-[clamp(2rem,6vw,5rem)] leading-none tracking-tight">
                Password Benchmark
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 pb-1">
            <ThemeToggle />
            <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/30 hidden sm:block">
              JS vs Rust WASM
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
        <section>
          <SectionLabel number="01" title="Input" />
          <div className="border-4 border-border shadow-shadow bg-secondary-background p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-heading text-xs uppercase tracking-[0.2em] text-foreground/50 block"
              >
                Password
              </label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-4 border-border bg-background text-foreground font-heading text-lg placeholder-foreground/30 focus:border-main outline-none transition-colors"
                placeholder="Enter password to analyze..."
              />
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
            <SectionLabel number="02" title="Performance Benchmark" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: <Timer size={16} />,
                    label: "JavaScript",
                    value: `${benchmark.jsTime.toFixed(3)}ms`,
                    sub: "median time",
                  },
                  {
                    icon: <Zap size={16} />,
                    label: implementationName,
                    value: `${benchmark.wasmTime.toFixed(3)}ms`,
                    sub: "median time",
                  },
                  {
                    icon: <TrendingUp size={16} />,
                    label: "Speedup",
                    value: `${benchmark.speedup.toFixed(2)}×`,
                    sub: `${benchmark.iterations.toLocaleString()} iterations`,
                    highlight: benchmark.speedup > 1,
                  },
                ].map(({ icon, label, value, sub, highlight }) => (
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
                  </div>
                ))}
              </div>

              <div className="border-4 border-border bg-secondary-background p-6 space-y-4">
                <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Visual comparison
                </span>
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
            <SectionLabel number="03" title="Statistical Detail" />
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
                    />
                    <StatRow
                      label="Mean"
                      value={`${stats.mean.toFixed(3)}ms`}
                    />
                    <StatRow label="Min" value={`${stats.min.toFixed(3)}ms`} />
                    <StatRow label="Max" value={`${stats.max.toFixed(3)}ms`} />
                    <StatRow
                      label="Valid samples"
                      value={String(stats.count)}
                    />
                    <StatRow
                      label="Outliers removed"
                      value={String(stats.outliers)}
                    />
                    <StatRow
                      label="Consistency"
                      value={`${consistency.toFixed(1)}%`}
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
                  { label: "JS Samples", value: benchmark.jsStats.count },
                  { label: "WASM Samples", value: benchmark.wasmStats.count },
                  {
                    label: "Rating",
                    value:
                      benchmark.jsStats.count >= 10 &&
                      benchmark.wasmStats.count >= 10
                        ? "HIGH"
                        : "MEDIUM",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="text-right">
                    <div className="font-heading text-lg leading-none">
                      {value}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-foreground/30 mt-0.5">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(jsResult || wasmResult) && (
          <section>
            <SectionLabel number="04" title="Strength Analysis" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {jsResult && (
                <StrengthPanel
                  result={jsResult}
                  label="JavaScript Analysis"
                  accent="JS"
                />
              )}
              {wasmResult && (
                <StrengthPanel
                  result={wasmResult}
                  label={implementationName}
                  accent="WASM"
                />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default PasswordPerformance;
