<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Neobrutalism Dashboard Project

This is a React TypeScript project using Vite, built with neobrutalism design principles and components based on shadcn/ui.

## Key Technologies

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** components with neobrutalism styling
- **Lucide React** for icons

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

## File Structure

- Components in `/src/components/`
- UI components in `/src/components/ui/`
- Main dashboard component: `/src/components/Dashboard.tsx`
- Global styles with neobrutalism CSS variables in `/src/index.css`

When suggesting code, prioritize neobrutalism design patterns and ensure components follow the established styling system.

## Coding Style Guidelines

- **Prefer self-documenting code over comments** - Use clear, descriptive variable and function names
- **Choose meaningful names** - Variables and functions should clearly express their purpose
- **Write clean, readable code** - Code should be easy to understand without extensive comments
- **Use TypeScript effectively** - Leverage type definitions to make code intent clear
- **Keep functions small and focused** - Each function should have a single, clear responsibility
- **Avoid unnecessary comments** - Only add comments for complex business logic or non-obvious decisions
