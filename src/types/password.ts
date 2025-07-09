export interface PasswordStrengthResult {
  score: number;
  max_score: number;
  strength_level: string;
  feedback: string;
  entropy: number;
  time_to_crack: string;
}

export interface WasmModule {
  analyze_password_strength: (password: string) => PasswordStrengthResult;
  benchmark_password_analysis: (password: string, iterations: number) => number;
}

export interface BenchmarkStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  count: number;
  outliers: number;
}

export interface BenchmarkResult {
  jsTime: number;
  wasmTime: number;
  speedup: number;
  iterations: number;
  jsStats?: BenchmarkStats;
  wasmStats?: BenchmarkStats;
}

// extend for garbage collection function
declare global {
  interface Window {
    gc?: () => void;
  }
}
