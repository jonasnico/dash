import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import {
  ArrowLeft,
  Zap,
  Timer,
  Shield,
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

const PasswordPerformance: React.FC = () => {
  const [password, setPassword] = useState("MySecurePassword123!");
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [wasmResult, setWasmResult] = useState<PasswordStrengthResult | null>(
    null
  );
  const [jsResult, setJsResult] = useState<PasswordStrengthResult | null>(null);
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
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return sorted.filter((time) => time >= lowerBound && time <= upperBound);
  }, []);

  const calculateStatistics = useCallback(
    (times: number[]): BenchmarkStats => {
      const filtered = removeOutliers(times);
      const mean =
        filtered.reduce((sum, time) => sum + time, 0) / filtered.length;
      const median = filtered[Math.floor(filtered.length / 2)];
      const min = Math.min(...filtered);
      const max = Math.max(...filtered);

      return {
        mean,
        median,
        min,
        max,
        count: filtered.length,
        outliers: times.length - filtered.length,
      };
    },
    [removeOutliers]
  );

  const runHighPrecisionBenchmark = useCallback(
    async (
      fn: () => void,
      iterations: number,
      rounds: number = 10
    ): Promise<number[]> => {
      const times: number[] = [];

      for (let round = 0; round < rounds; round++) {
        // Force garbage collection before each round if available
        if (window.gc) {
          window.gc();
        }

        // Small delay to ensure stable conditions
        await new Promise((resolve) => setTimeout(resolve, 5));

        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          fn();
        }
        const end = performance.now();

        times.push(end - start);
      }

      return times;
    },
    []
  );

  const analyzePassword = useCallback(async () => {
    if (!wasmModule) return;

    try {
      // Single analysis for results display
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

      console.log(
        `Running benchmark with ${iterations} iterations over ${rounds} rounds`
      );

      // Extended warm-up to stabilize JIT compilation and browser optimization
      console.log("Warming up...");
      for (let i = 0; i < warmupRounds; i++) {
        // Warm up JavaScript
        for (let j = 0; j < Math.min(2000, iterations / 2); j++) {
          analyzePasswordJS(password);
        }

        // Warm up WASM
        wasmModule.benchmark_password_analysis(
          password,
          Math.min(2000, iterations / 2)
        );

        // Small delay between warm-up rounds
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      console.log("Running JavaScript benchmark...");
      const jsTimes = await runHighPrecisionBenchmark(
        () => analyzePasswordJS(password),
        iterations,
        rounds
      );

      console.log("Running WASM benchmark...");
      const wasmTimes: number[] = [];
      for (let round = 0; round < rounds; round++) {
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }

        await new Promise((resolve) => setTimeout(resolve, 5));
        const wasmTime = wasmModule.benchmark_password_analysis(
          password,
          iterations
        );
        wasmTimes.push(wasmTime);
      }

      const jsStats = calculateStatistics(jsTimes);
      const wasmStats = calculateStatistics(wasmTimes);

      console.log("JS Stats:", jsStats);
      console.log("WASM Stats:", wasmStats);

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

      console.log(
        `Benchmark complete: JS=${jsTime.toFixed(2)}ms, WASM=${wasmTime.toFixed(
          2
        )}ms, Speedup=${(jsTime / wasmTime).toFixed(2)}x`
      );
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Password analysis failed");
    }
  }, [wasmModule, password, calculateStatistics, runHighPrecisionBenchmark]);

  useEffect(() => {
    if (wasmModule && password) {
      analyzePassword();
    }
  }, [wasmModule, password, analyzePassword]);

  const getStrengthColor = (level: string) => {
    switch (level) {
      case "Very Weak":
        return "bg-red-500";
      case "Weak":
        return "bg-orange-500";
      case "Fair":
        return "bg-yellow-500";
      case "Strong":
        return "bg-blue-500";
      case "Very Strong":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStrengthBorderColor = (level: string) => {
    switch (level) {
      case "Very Weak":
        return "border-red-500";
      case "Weak":
        return "border-orange-500";
      case "Fair":
        return "border-yellow-500";
      case "Strong":
        return "border-blue-500";
      case "Very Strong":
        return "border-green-500";
      default:
        return "border-gray-500";
    }
  };

  const StrengthCard = ({
    result,
    title,
    icon,
    iconColor,
  }: {
    result: PasswordStrengthResult;
    title: string;
    icon: React.ReactNode;
    iconColor: string;
  }) => (
    <Card className="border-2 border-border rounded-base shadow-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className={iconColor}>{icon}</div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Strength Level</span>
            <Badge
              className={`${getStrengthColor(
                result.strength_level
              )} text-white border-0 px-3 py-1 rounded-base font-weight-base`}
            >
              {result.strength_level}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground">Score</span>
              <span className="text-foreground">
                {result.score}/{result.max_score}
              </span>
            </div>
            <div
              className={`w-full h-3 border-2 ${getStrengthBorderColor(
                result.strength_level
              )} rounded-base overflow-hidden`}
            >
              <div
                className={`h-full ${getStrengthColor(
                  result.strength_level
                )} transition-all duration-300`}
                style={{ width: `${(result.score / result.max_score) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">Entropy:</span>
              <span className="text-foreground">
                {result.entropy.toFixed(1)} bits
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Time to crack:</span>
              <span className="text-foreground">{result.time_to_crack}</span>
            </div>
          </div>

          {result.feedback !== "Great password!" &&
            result.feedback !== "Excellent password!" && (
              <div className="p-3 border-2 border-orange-300 rounded-base bg-orange-50">
                <p className="text-sm text-orange-800 font-weight-base">
                  {result.feedback}
                </p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-2 border-border bg-main">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="default" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-heading text-main-foreground">
                  Password Performance Lab
                </h1>
                <p className="text-sm text-main-foreground/80">
                  JavaScript vs {implementationName} Performance Comparison
                </p>
                <p className="text-xs text-main-foreground/60">
                  Benchmarking Rust-compiled WebAssembly against native JavaScript
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card className="border-2 border-border rounded-base shadow-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                Password Analysis
              </CardTitle>
              <CardDescription>
                Enter a password to analyze its strength and compare performance between JavaScript and Rust WebAssembly implementations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-weight-base mb-2 text-foreground"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-base bg-secondary-background text-foreground placeholder-foreground/60 focus:border-main outline-none"
                    placeholder="Enter password to analyze..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-foreground/70 mr-2">Try:</span>
                  {[
                    "password123",
                    "MyStr0ng!P@ssw0rd", 
                    "abcd1234",
                    "SuperSecure2024!",
                    "qwerty",
                    "Tr0ub4dor&3",
                    "correcthorsebatterystaple",
                    "P@ssw0rd!2024#Secure"
                  ].map((example) => (
                    <Button
                      key={example}
                      variant="neutral"
                      size="sm"
                      onClick={() => setPassword(example)}
                      className="text-xs"
                    >
                      {example}
                    </Button>
                  ))}
                </div>

                {error && (
                  <div className="p-3 border-2 border-red-500 rounded-base bg-red-50 text-red-700">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-2 text-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading WebAssembly module...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {benchmark && (
            <Card className="border-2 border-border rounded-base shadow-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Zap className="h-5 w-5" />
                  Performance Benchmark
                </CardTitle>
                <CardDescription>
                  Execution time comparison ({benchmark.iterations} iterations)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="h-4 w-4 text-yellow-600" />
                      <span className="font-weight-heading text-foreground">
                        JavaScript
                      </span>
                    </div>
                    <div className="text-2xl font-weight-heading text-foreground">
                      {benchmark.jsTime.toFixed(3)}ms
                    </div>
                  </div>

                  <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="font-weight-heading text-foreground">
                        {implementationName}
                      </span>
                    </div>
                    <div className="text-2xl font-weight-heading text-foreground">
                      {benchmark.wasmTime.toFixed(3)}ms
                    </div>
                  </div>

                  <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-weight-heading text-foreground">
                        Speedup
                      </span>
                    </div>
                    <div className="text-2xl font-weight-heading text-foreground">
                      {benchmark.speedup.toFixed(1)}x
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {benchmark && benchmark.jsStats && benchmark.wasmStats && (
            <Card className="border-2 border-border rounded-base shadow-shadow bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-weight-heading text-foreground">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Detailed Performance Statistics
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Statistical analysis of{" "}
                  {benchmark.iterations.toLocaleString()} iterations across
                  multiple rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                    <h3 className="font-weight-heading text-foreground mb-3 flex items-center gap-2">
                      <Timer className="h-4 w-4 text-yellow-600" />
                      JavaScript Stats
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Median:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.jsStats.median.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Mean:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.jsStats.mean.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Min:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.jsStats.min.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Max:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.jsStats.max.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">
                          Valid Samples:
                        </span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.jsStats.count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Outliers:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.jsStats.outliers}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                    <h3 className="font-weight-heading text-foreground mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      Rust WebAssembly Stats
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Median:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.wasmStats.median.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Mean:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.wasmStats.mean.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Min:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.wasmStats.min.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Max:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.wasmStats.max.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">
                          Valid Samples:
                        </span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.wasmStats.count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Outliers:</span>
                        <span className="font-weight-heading text-foreground">
                          {benchmark.wasmStats.outliers}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 border-2 border-border rounded-base bg-main/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-weight-heading text-foreground text-sm">
                      Benchmark Reliability
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-foreground/70">
                        JS Consistency:
                      </span>
                      <span className="ml-2 font-weight-heading text-foreground">
                        {(
                          100 -
                          ((benchmark.jsStats.max - benchmark.jsStats.min) /
                            benchmark.jsStats.mean) *
                            100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground/70">
                        WASM Consistency:
                      </span>
                      <span className="ml-2 font-weight-heading text-foreground">
                        {(
                          100 -
                          ((benchmark.wasmStats.max - benchmark.wasmStats.min) /
                            benchmark.wasmStats.mean) *
                            100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground/70">Confidence:</span>
                      <span className="ml-2 font-weight-heading text-foreground">
                        {benchmark.jsStats.count >= 10 &&
                        benchmark.wasmStats.count >= 10
                          ? "High"
                          : "Medium"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jsResult && (
              <StrengthCard
                result={jsResult}
                title="JavaScript Analysis"
                icon={<Timer className="h-5 w-5" />}
                iconColor="text-yellow-600"
              />
            )}

            {wasmResult && (
              <StrengthCard
                result={wasmResult}
                title={implementationName}
                icon={<Activity className="h-5 w-5" />}
                iconColor="text-blue-600"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPerformance;
