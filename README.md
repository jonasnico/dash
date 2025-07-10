# A little app to experiment with different webtech

## Tech used

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with neobrutalism design variables
- **WebAssembly**: Rust compiled to WASM using wasm-bindgen
- **Routing**: React Router DOM
- **Icons**: Lucide React

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
