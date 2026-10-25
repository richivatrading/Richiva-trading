# Richiva Trading Dashboard

Next.js, React, and Tailwind CSS dashboard.

## Project Structure

- `src/app/layout.tsx` - Root layout and document metadata
- `src/app/page.tsx` - Main dashboard route
- `src/app/Auth.tsx` - Login and verification flow
- `src/App.tsx` - Primary application component
- `src/views/` - Dashboard pages and supporting components
- `src/index.css` - Global styles and Tailwind CSS v4 imports
- `package.json` - Development, build, lint, and formatting scripts
- `next.config.mjs` - Next.js configuration
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the PostCSS plugin
- Build tooling: Next.js and TypeScript
- Quality tools: oxfmt and oxlint

## Styling

This project uses **Tailwind CSS v4** through `@tailwindcss/postcss`. `src/app/layout.tsx` imports `src/index.css`, which imports Tailwind with `@import 'tailwindcss';`. Use utility classes directly in JSX and put global styles or theme customization in `src/index.css`.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.