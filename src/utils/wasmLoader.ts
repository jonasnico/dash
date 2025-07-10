import type { WasmModule } from "@/types/password";

export async function loadPasswordWasm(): Promise<WasmModule> {
  try {
    console.log("Attempting to load WebAssembly module...");

    const wasmModule = await import("../wasm/password_strength_wasm.js");

    await wasmModule.default(
      new URL("../wasm/password_strength_wasm_bg.wasm", import.meta.url)
    );

    console.log("WebAssembly module loaded successfully!");

    try {
      const testScore = wasmModule.analyze_password_score("test123");
      console.log("WASM test successful, score:", testScore);
    } catch (testError) {
      console.warn("WASM test failed:", testError);
      throw new Error("WASM module test failed");
    }

    return {
      analyze_password_strength: (password: string) => {
        try {
          const score = wasmModule.analyze_password_score(password);
          const strength_level = wasmModule.get_strength_level(score);
          const entropy = wasmModule.calculate_entropy(password);

          return {
            score,
            max_score: 100,
            strength_level,
            feedback: "Rust WebAssembly analysis complete",
            entropy,
            time_to_crack: "varies",
          };
        } catch (error) {
          console.error("WASM analysis error:", error);
          throw error;
        }
      },
      benchmark_password_analysis: (password: string, iterations: number) => {
        try {
          return wasmModule.benchmark_computation(password, iterations);
        } catch (error) {
          console.error("WASM benchmark error:", error);
          return 0;
        }
      },
    };
  } catch (error) {
    console.warn(
      "Failed to load WebAssembly module, falling back to JavaScript:",
      error
    );

    const { analyzePasswordJS } = await import("./passwordAnalysis");

    return {
      analyze_password_strength: (password: string) => {
        const jsResult = analyzePasswordJS(password);
        return {
          ...jsResult,
          feedback: "JavaScript fallback analysis (WASM unavailable)",
        };
      },
      benchmark_password_analysis: (password: string, iterations: number) => {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          analyzePasswordJS(password);
          
          let hash = 0;
          for (let j = 0; j < password.length; j++) {
            const char = password.charCodeAt(j);
            hash = (hash * 31 + char) >>> 0;
            hash = (hash * 1103515245 + 12345) >>> 0;
            Math.sqrt(char * (j + 1));
          }
        }
        const end = performance.now();

        return end - start;
      },
    };
  }
}
