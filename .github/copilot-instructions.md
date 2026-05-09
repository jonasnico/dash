<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# The Dash — Password Performance Lab

A React/TypeScript app focused on benchmarking JavaScript vs Rust WebAssembly for password strength analysis. Uses a Swiss Poster Brutalism design system built on top of shadcn/ui + Tailwind CSS v4.

## Package Manager

**Use pnpm exclusively.** Never suggest `npm install` or `yarn`. Always use `pnpm install`, `pnpm dev`, `pnpm build`, etc.

## Key Technologies

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **shadcn/ui** components with custom Swiss Brutalism overrides
- **Lucide React** for icons
- **Rust + wasm-pack** compiled to WebAssembly (`wasm-password/src/lib.rs`)
- **React Router DOM** — single route `/` → `PasswordPerformance`

## Design System — Swiss Poster Brutalism

All tokens are in `src/index.css`:

- `--border-radius: 0px` — sharp corners everywhere
- `--main: #FF2D2D` — red accent
- `--background: #FFFFFF` / `--foreground: #000000` — pure black/white
- `--shadow-shadow: 5px 5px 0px 0px var(--border)` — hard drop shadow
- Dark mode: `--border: #FFFFFF` (white borders on dark background)
- Typography: Archivo Black (`font-heading`) + DM Sans (`font-base`)

Component rules:
- `border-4 border-border` (4px solid borders), not `border-2`
- `shadow-shadow` for elevated cards
- `bg-main text-white` for highlighted/active states
- `bg-secondary-background` for card backgrounds
- Section labels: `<SectionLabel number="01" title="Section Name" />`
- Uppercase tracking labels: `text-[10px] uppercase tracking-[0.2em] text-foreground/40`

## Architecture

### Entry point
- `src/App.tsx` — single route `/` → `PasswordPerformance`

### Main page
- `src/components/PasswordPerformance.tsx` — the entire app UI
  - Sections 02–05: Input, Benchmark, Statistical Detail, Strength Analysis
  - Random password generator using `crypto.getRandomValues` with rejection sampling
  - Widget drawer trigger in the header

### Supporting components
- `src/components/WidgetDrawer.tsx` — slide-out panel with weather/fact/GitHub widgets (lazy-loaded on first open)

### Password analysis
- `src/utils/passwordAnalysis.ts` — JS implementation
- `src/utils/wasmLoader.ts` — loads WASM module, wraps exports, provides fallback
- `src/wasm/` — compiled WASM output (do not edit directly)

### WASM source
- `wasm-password/src/lib.rs` — Rust implementation
- Build: `PATH="$HOME/.cargo/bin:..." pnpm build:wasm` then `cp public/wasm-real/* src/wasm/`
- **Important**: system may have Homebrew `rustc` at `/opt/homebrew/bin/rustc` which lacks `wasm32-unknown-unknown`. Always prefix PATH with rustup's bin.

### Scoring algorithm (JS and Rust must stay in sync)
```
charset_size = (hasLower?26:0) + (hasUpper?26:0) + (hasDigit?10:0) + (hasSymbol?32:0)
entropy = length * log2(charset_size)
entropy_score = min(80, entropy * 0.8)
variety_bonus = count(categories_present) * 5  (max 20)
penalties: "password" −20, "123" −10, keyboard patterns −10, 3+ repeated chars −10
score = clamp(0, 100, entropy_score + variety_bonus − penalties)
```
Strength thresholds: <30 Very Weak, 30–49 Weak, 50–69 Fair, 70–84 Strong, 85+ Very Strong

## API Integration

- Weather: Open-Meteo (no key required)
- Useless facts: `https://uselessfacts.jsph.pl/api/v2/facts/random`
- All fetches are lazy — only triggered when the widget drawer is first opened

## Coding Style Guidelines

- **NEVER add comments unless absolutely critical** — code must be self-documenting
- **Descriptive names are mandatory** — names should eliminate the need for comments
- **Functions must have single, obvious purposes**
- **TypeScript types are documentation** — use precise types to communicate intent
- **Readable code over clever code**
- **Zero tolerance for unnecessary comments**

