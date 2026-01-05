# AI Chat Application

A modern, production-ready AI chat interface built with React, TypeScript, and Vite.

## Structure

```
chatgpt-clone-v2/
├── .github/          # GitHub Actions
├── e2e/              # E2E tests
├── public/           # Static assets
├── scripts/          # Build scripts
├── src/
│   ├── app/          # UI components & pages
│   ├── infra/        # External services (models, MCP)
│   ├── lib/          # Utilities & core logic
│   ├── tests/        # Unit tests
│   └── types/        # TypeScript definitions
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
└── README.md
```

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

## Environment

Copy `.env.example` to `.env` and add your API keys.
