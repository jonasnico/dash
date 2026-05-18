/* tslint:disable */
/* eslint-disable */
export function analyze_password_score(password: string): number;
export function get_strength_level(score: number): string;
export function calculate_entropy(password: string): number;
export function get_time_to_crack(password: string): string;
export function get_feedback(password: string): string;
/**
 * Benchmarks the full analysis pipeline in a single pass per iteration —
 * equivalent algorithmic work to `analyzePasswordJS` on the JS side.
 * Timed inside WASM to exclude JS↔WASM boundary overhead.
 */
export function benchmark_full_analysis(password: string, iterations: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly analyze_password_score: (a: number, b: number) => number;
  readonly get_strength_level: (a: number) => [number, number];
  readonly calculate_entropy: (a: number, b: number) => number;
  readonly get_time_to_crack: (a: number, b: number) => [number, number];
  readonly get_feedback: (a: number, b: number) => [number, number];
  readonly benchmark_full_analysis: (a: number, b: number, c: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
