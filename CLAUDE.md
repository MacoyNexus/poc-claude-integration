# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UIGen** — an AI-powered React component generator with live preview. Users describe a component in a chat interface, Claude generates/edits the files, and results render instantly in a sandboxed iframe preview.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run dev:daemon   # Start in background, logs to logs.txt
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (run all tests)
npm run setup        # First-time setup: install + prisma generate + migrate
npm run db:reset     # Reset SQLite database (destructive)
```

Run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Architecture

### Request Flow

1. User types in `ChatInterface` → `chat-context.tsx` sends POST to `/api/chat`
2. `/api/chat/route.ts` streams a response via Vercel AI SDK's `streamText()` using `claude-haiku-4-5`
3. Claude calls two tools during generation: `str_replace_editor` (surgical edits) and `file_manager` (create/delete/rename)
4. Tool call results are handled in `file-system-context.tsx`, updating the in-memory `VirtualFileSystem`
5. `PreviewFrame` re-renders the virtual FS by evaluating `App.jsx` with `@babel/standalone` inside a sandboxed iframe
6. For authenticated users, messages and file state are serialized to JSON and persisted in Prisma (`Project.messages` / `Project.data`)

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory tree; no files are ever written to disk. Serializes to JSON for Prisma persistence.
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): React context wrapping VirtualFileSystem; processes Claude tool calls and triggers re-renders.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`; serializes the virtual FS with each request so Claude knows current file state.
- **`provider.ts`** (`src/lib/provider.ts`): Switches between real Claude (`claude-haiku-4-5`) and a `MockLanguageModel` when `ANTHROPIC_API_KEY` is absent. Mock generates a static counter/form/card component.
- **`auth.ts`** (`src/lib/auth.ts`): JWT sessions in HTTP-only cookies (7-day expiry). Server actions (`src/actions/`) handle sign-up/sign-in with bcrypt.

### UI Layout (`src/app/main-content.tsx`)

Resizable panels via `react-resizable-panels`:
- **Left (35%)**: `ChatInterface` with message list and input
- **Right (65%)**: Tabs
  - *Preview*: `PreviewFrame` (iframe sandbox)
  - *Code*: `FileTree` (30%) + `CodeEditor` (70%, Monaco)

### Database

Prisma + SQLite (`prisma/dev.db`). Two models:
- `User`: email + bcrypt password
- `Project`: belongs to User; stores `messages` (JSON) and `data` (JSON serialized VirtualFileSystem)

Anonymous users work entirely in-memory with no persistence.

### System Prompt

Claude's behavior is defined in `src/lib/prompts/generation.ts`. The `/api/chat` route sends it with `providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } }` for prompt caching.

## Environment

```
ANTHROPIC_API_KEY=""   # Optional — falls back to mock provider if absent
```

## Path Alias

`@/*` maps to `./src/*`.
