import type { WasmModule } from "@/types/password";

export async function loadPasswordWasm(): Promise<WasmModule> {
  try {
    const wasmModule = await import("../wasm/password_strength_wasm.js");

    await wasmModule.default(
      new URL("../wasm/password_strength_wasm_bg.wasm", import.meta.url)
    );

    const testScore = wasmModule.analyze_password_score("test123");
    if (typeof testScore !== "number") throw new Error("WASM module test failed");

    return {
      analyze_password_strength: (password: string) => {
        const score = wasmModule.analyze_password_score(password);
        return {
          score,
          max_score: 100,
          strength_level: wasmModule.get_strength_level(score),
          feedback: wasmModule.get_feedback(password),
          entropy: wasmModule.calculate_entropy(password),
          time_to_crack: wasmModule.get_time_to_crack(password),
        };
      },
      benchmark_password_analysis: (password: string, iterations: number) =>
        wasmModule.benchmark_computation(password, iterations),
    };
  } catch (error) {
    console.warn("Failed to load WebAssembly module, falling back to JavaScript:", error);

    const { analyzePasswordJS } = await import("./passwordAnalysis");

    return {
      analyze_password_strength: (password: string) => ({
        ...analyzePasswordJS(password),
        feedback: "JavaScript fallback (WASM unavailable). " + analyzePasswordJS(password).feedback,
      }),
      benchmark_password_analysis: (password: string, iterations: number) => {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) analyzePasswordJS(password);
        return performance.now() - start;
      },
    };
  }
}

