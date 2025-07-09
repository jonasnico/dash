# Password Performance Dashboard

A React TypeScript application showcasing WebAssembly performance comparison with a password strength calculator.

## Features

- **Performance Comparison**: Side-by-side JavaScript vs WebAssembly execution
- **Real-time Analysis**: Live password strength analysis as you type
- **Benchmarking**: Statistical performance comparison with multiple iterations
- **Neobrutalism Design**: Bold, high-contrast UI following design system principles
- **Routing**: Separate route for performance testing (`/password-performance`)

## Tech used

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with neobrutalism design variables
- **WebAssembly**: Rust compiled to WASM using wasm-bindgen
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx           # Main dashboard
│   ├── PasswordPerformance.tsx # Performance comparison component
│   └── ui/                     # Reusable UI components
├── types/
│   ├── password.ts             # Password analysis types
│   └── wasm.d.ts              # WASM module declarations
├── utils/
│   ├── wasmLoader.ts           # WASM module loader
│   └── wasmLoader2.ts          # Alternative WASM loader
└── wasm/                       # Copied WASM files

wasm/                           # Rust WASM source
├── src/
│   ├── lib.rs                  # Main WASM implementation
│   └── utils.rs                # Utility functions
├── Cargo.toml                  # Rust dependencies
└── pkg/                        # Generated WASM output

public/wasm/                    # WASM files for browser
├── password_strength_wasm.js
├── password_strength_wasm_bg.wasm
└── *.d.ts                      # Type definitions
```

## Setup Dev environement

### Prerequisites
- Node.js 18+
- Rust toolchain
- wasm-pack

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build WASM module**
   ```bash
   cd wasm
   wasm-pack build --target web --out-dir pkg
   ```

3. **Copy WASM files**
   ```bash
   cp wasm/pkg/* public/wasm/
   cp wasm/pkg/* src/wasm/
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Password strength algo

The password strength calculator analyzes multiple factors:

### Scoring Components (0-100 points)
- **Length (0-30 points)**
  - < 5 chars: 0 points
  - 5-7 chars: 10 points  
  - 8-11 chars: 20 points
  - 12-15 chars: 25 points
  - 16+ chars: 30 points

- **Character Variety (0-40 points)**
  - Lowercase letters: +10 points
  - Uppercase letters: +10 points
  - Numbers: +10 points
  - Special characters: +10 points

- **Pattern Penalties (0-30 points deducted)**
  - Common sequences (123, abc): -10 points
  - Repeated characters (aaa): -10 points
  - Common passwords: -20 points

### Additional Metrics
- **Entropy**: Calculated based on character set size and length
- **Time to Crack**: Estimated based on 1 billion guesses/second
- **Strength Levels**: Very Weak → Weak → Fair → Strong → Very Strong

## WebAssembly Implementation

### Rust Code Structure

```rust
#[wasm_bindgen]
pub struct PasswordStrengthResult {
    score: u32,
    max_score: u32,
    strength_level: String,
    feedback: String,
    entropy: f64,
    time_to_crack: String,
}

#[wasm_bindgen]
pub fn analyze_password_strength(password: &str) -> PasswordStrengthResult {
}

#[wasm_bindgen]  
pub fn benchmark_password_analysis(password: &str, iterations: u32) -> f64 {
}
```

### JS integration

```typescript
interface WasmModule {
  analyze_password_strength: (password: string) => PasswordStrengthResult;
  benchmark_password_analysis: (password: string, iterations: number) => number;
}

const wasmModule = await loadPasswordWasm();
```

## Performance comparison

The dashboard compares execution times between:

1. **JavaScript Implementation**: Pure JS password analysis
2. **WebAssembly Implementation**: Rust compiled to WASM
3. **Benchmark Results**: Statistical comparison over multiple iterations

### Typical Results
- WASM often shows 20-70% performance improvement
- Varies based on password complexity and browser
- More significant gains with complex algorithms

## Deploy

### Build for Production
```bash
# Build WASM
cd wasm && wasm-pack build --target web

# Build React app
npm run build
```

### Environment Setup
- Ensure WASM files are served with correct MIME types
- Configure server to handle `.wasm` files as `application/wasm`

## Testing

### Manual Testing
1. Navigate to `/password-performance`
2. Enter various passwords to test:
   - Simple passwords (test weakness detection)
   - Complex passwords (test strength scoring)
   - Edge cases (empty, very long passwords)

### Performance Testing
- Compare execution times between JS and WASM
- Test with different password patterns
- Verify benchmark results consistency

## Possible add-ons

### Potential features
- **Visual Entropy Meter**: Graphical representation of password randomness
- **Historical Performance**: Track performance metrics over time
- **Advanced Algorithms**: Dictionary attacks, machine learning models
- **Offline PWA**: Service worker for offline password analysis
- **Export Results**: Download performance comparison reports

### WASM optimizations
- **Memory Management**: Optimize string passing between JS and WASM
- **Bulk Operations**: Process multiple passwords simultaneously
- **Advanced Algorithms**: Implement more sophisticated analysis
- **SIMD Instructions**: Leverage WebAssembly SIMD for parallel processing

## Resources/docs

- [WebAssembly Official Docs](https://webassembly.org/)
- [wasm-bindgen Book](https://rustwasm.github.io/wasm-bindgen/)
- [Rust and WebAssembly Book](https://rustwasm.github.io/book/)
- [React Router Documentation](https://reactrouter.com/)