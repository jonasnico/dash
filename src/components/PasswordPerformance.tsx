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
    ? "WebAssembly"
    : "JavaScript (Fallback)";

  const analyzePassword = useCallback(async () => {
    if (!wasmModule) return;

    try {
      const jsRes = analyzePasswordJS(password);
      const wasmRes = wasmModule.analyze_password_strength(password);

      setJsResult(jsRes);
      setWasmResult(wasmRes);

      const iterations = 1000;

      const jsStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        analyzePasswordJS(password);
      }
      const jsEnd = performance.now();
      const jsTime = jsEnd - jsStart;

      const wasmTime = wasmModule.benchmark_password_analysis(
        password,
        iterations
      );

      setBenchmark({
        jsTime,
        wasmTime,
        speedup: wasmTime > 0 ? jsTime / wasmTime : 1,
        iterations,
      });
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Password analysis failed");
    }
  }, [wasmModule, password]);

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
                Enter a password to analyze its strength and compare performance
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
                  {["password123", "MyStr0ng!P@ssw0rd", "abcd1234"].map(
                    (example) => (
                      <Button
                        key={example}
                        variant="neutral"
                        size="sm"
                        onClick={() => setPassword(example)}
                        className="text-xs"
                      >
                        {example}
                      </Button>
                    )
                  )}
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
