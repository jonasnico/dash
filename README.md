# The Dash — Password Performance Lab

A personal playground for experimenting with web tech, focused on benchmarking JavaScript vs Rust WebAssembly for password analysis.

## Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS v4** — Swiss Poster Brutalism design system
- **Rust + wasm-pack** — compiled to WebAssembly for true JS vs WASM performance comparison
- **React Router DOM** — client-side routing
- **Lucide React** — icons
- **pnpm** — package manager

## Design

Swiss Poster Brutalism aesthetic: `0px` border-radius, `#FF2D2D` red accent, pure black/white palette, bold 4px borders with hard 5px drop shadows, Archivo Black + DM Sans typography.

## Features

- **Password Performance Lab** — the main page. Analyze any password with a JS and WASM implementation running independently. Benchmarks N iterations, collects statistics, removes outliers via IQR, compares results.
- **Strength Analysis** — entropy-based scoring identical in both JS and Rust. Score = `entropy * 0.8 + variety_bonus - penalties`, clamped 0–100.
- **Random password generator** — `crypto.getRandomValues` with rejection sampling to avoid modulo bias. Configurable character sets.
- **Widget drawer** — slide-out panel with weather, daily fact, and GitHub widgets (lazy-loaded on first open).

## Getting Started

```bash
pnpm install
pnpm dev
```

## Build WASM

The WASM module source lives in `wasm-password/`. After editing `lib.rs`, rebuild and sync:

```bash
# Requires rustup (not Homebrew rustc) — prefix PATH if needed
PATH="$HOME/.cargo/bin:$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$PATH" \
  pnpm build:wasm

# Sync output to src/wasm/ (app imports from there)
cp public/wasm-real/password_strength_wasm* src/wasm/
```

## Production Build

```bash
pnpm build
```

> Ensure `.wasm` files are served with `Content-Type: application/wasm`.
