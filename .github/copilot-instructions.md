<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Neobrutalism Dashboard Project

This is a React TypeScript project using Vite, built with neobrutalism design principles and components based on shadcn/ui.

## Key Technologies

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** components with neobrutalism styling
- **Lucide React** for icons
- **Rust WebAssembly** for high-performance password analysis and benchmarking

## Design System

- Uses neobrutalism design principles with bold borders, box shadows, and high contrast
- Color system based on CSS custom properties: `--main`, `--background`, `--foreground`, `--border`, etc.
- Font weights: `--font-weight-heading` and `--font-weight-base`
- Border radius: `--radius-base`
- Box shadows: `--shadow-shadow`

## Component Guidelines

- All UI components should use the neobrutalism styling variables
- Components should have bold 2px borders (`border-2 border-border`)
- Use `rounded-base` for border radius
- Apply `shadow-shadow` for consistent box shadows
- Use semantic color classes: `bg-main`, `bg-secondary-background`, `text-foreground`, `text-main-foreground`

## API Integration

- Fetches daily useless facts from https://uselessfacts.jsph.pl/api/v2/facts/random
- Handle loading states and error cases appropriately

## Performance Features

- **Password Performance Lab** comparing JavaScript vs Rust WebAssembly implementations
- High-precision benchmarking with statistical analysis and outlier detection
- WASM module compiled from Rust for optimal performance comparison
- Located at `/password-performance` route with detailed performance metrics

## File Structure

- Components in `/src/components/`
- UI components in `/src/components/ui/`
- Main dashboard component: `/src/components/Dashboard.tsx`
- Global styles with neobrutalism CSS variables in `/src/index.css`

When suggesting code, prioritize neobrutalism design patterns and ensure components follow the established styling system.

## Coding Style Guidelines

- **NEVER add comments unless absolutely critical** - Code must be self-documenting through clear naming
- **Descriptive variable and function names are mandatory** - Names should eliminate the need for comments
- **Functions must have single, obvious purposes** - Split complex logic into clearly named functions
- **TypeScript types are documentation** - Use precise types to communicate intent
- **Readable code over clever code** - Prioritize clarity and maintainability
- **Zero tolerance for unnecessary comments** - Only document complex business logic or non-obvious technical decisions
- **Self-documenting code is the highest priority** - Invest time in perfect naming over explanatory comments
