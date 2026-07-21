# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Respond to the user in Russian (this is a Russian-speaking team's project) unless they write in another language. Class names, code, library names, and English technical terms stay in English.

## What this is

Vateco is a NestJS monorepo that runs Telegram bots for AI image generation via ComfyUI, backed by rented GPU cloud instances (vast.ai / RunPod). Users interact through a Telegram bot; workflows (ComfyUI graphs) are parameterized templates stored in Postgres (via Prisma) and executed on a GPU host that the bot's cron jobs orchestrate over the filesystem (task files) and cloud APIs.

There is also `fe/admin`, a separate Next.js 15 + shadcn/ui admin frontend (its own package.json, not part of the NestJS/Nest CLI monorepo build).

## Commands

Backend (root `package.json`, NestJS monorepo, run from repo root):

```bash
npm run lint                       # eslint --fix on apps/libs/test
npm run format                     # prettier --write on apps/**/*.ts libs/**/*.ts
npm test                           # jest unit tests
npm run test:watch
npm run test:cov
npx jest path/to/file.spec.ts      # run a single test file
npm run test:e2e                   # e2e tests (apps/vateco/test/jest-e2e.json)
npm run build                      # ./build.sh -> nest build (all projects) + chmod CLI entrypoints
```

Run a single app in watch mode (each is a separate Nest CLI "project", see `nest-cli.json`):

```bash
npm run start:tg           # app-base-tg-bot (main Telegram bot)
npm run start:gp           # app-gp-tg-bot (secondary bot)
npm run start:admin:dev    # app-admin (REST API for the admin frontend)
npm run start:cloud-api:dev
npm run start:cloud-cron:dev
npm run start:cron:dev
```

CLIs (built, then invoked as scripts):

```bash
npm run cli            # app-cli: local/host-side operations (model create, workflow compile/parse, comfyui install)
npm run cloud-cli      # app-cloud-cli: operations meant to run on the rented GPU instance
```

Prisma / DB:

```bash
npx prisma generate            # or: npm run prisma:generate
npm run migrate:create         # prisma migrate dev --create-only
npm run migrate:deploy         # prisma migrate deploy (used in prod/amvera build)
```

Production process manager (`ecosystem.config.js`, pm2, apps built to `dist/`):

```bash
npm run start:tg:prod      # -> pm2 "my-tg-bot"
npm run start:admin:prod   # -> pm2 "admin"
npm run start:cloud:prod   # -> pm2 "cloud-api" + "cloud-cron"
```

Deployment target is amvera.ru (`amvera.yml`, `bin/amvera-build.sh`): build runs `nest build`, pulls secrets from Infisical into `.env`, then `prisma migrate deploy`, then starts `app-base-tg-bot` via `start:my-tg-bot:amvera`.

Frontend (`fe/admin`, run from that directory, independent Next.js app):

```bash
cd fe/admin
npm run dev
npm run build
npm run lint
```

## Architecture

### Monorepo layout and path aliases

This is a Nest CLI monorepo (`nest-cli.json`, `monorepo: true`) with multiple **application** projects under `apps/*` sharing code from top-level, non-`apps` directories that are wired as TS path aliases (`tsconfig.json`):

- `@lib` -> `libs/` — integration/infrastructure services (one Nest module each): Prisma, ComfyUI HTTP client, vast.ai, RunPod, HuggingFace, Civitai, OpenAI, Telegram bot helpers, rclone, message formatting, generic helpers.
- `@repo` -> `repo/` — thin Prisma-backed repositories, one per domain entity (model, workflow, user, tag, run, lock, setup, tg-bot-sessions-store, user-text-edits).
- `@synth` -> `synth/` — "synthesis" services: business logic that composes libs + repos into higher-level operations (workflow compiling/running, offer/instance management for renting GPUs, cloud-app orchestration, prompt handling). This is where most domain logic lives, not in `apps/*`.
- `@model` -> `model/` — static JSON catalog of known ML models (checkpoints, LoRAs, ControlNets, CLIP) merged and tagged in `model/index.ts`.
- `@kb` -> `keyboard/` — Telegraf inline keyboard/menu definitions, shared across bot apps.
- `@const` -> `const/` — shared constants (e.g. geolocation).

Each of these directories is itself a small collection of independent sub-packages (`libs/openai`, `repo/user`, `synth/workflow`, ...), each with its own `src/`, an `index.ts` barrel, and (except `@model`/`@const`) a Nest `*.module.ts` + `*.service.ts`. The directory-level `index.ts` (e.g. `libs/index.ts`, `repo/index.ts`) re-exports every sub-package, and app code imports via `import * as lib from '@lib'` / `* as repo from '@repo'` / `* as synth from '@synth'`, then references `lib.SomeLibService`, `repo.SomeRepository`, etc. When adding a new integration/repo/domain service, follow this pattern: new subfolder with its own module+service+index, then add the export to the parent barrel.

### Apps (`apps/*`)

- `app-base-tg-bot` — primary Telegram bot (Telegraf via `nestjs-telegraf`). Handles commands/text/photo/document messages and callback actions; drives users through workflow selection and param entry, writing generation requests to disk as task files for the cron jobs to pick up.
- `app-gp-tg-bot` — a second, simpler Telegram bot variant.
- `app-cron` — host-side cron jobs that run alongside the main bot (e.g. `check-generating-queue.cron-job.ts` scans an output directory for finished images and sends them to the configured Telegram chat).
- `app-admin` — REST API (NestJS controllers, no bot) backing the `fe/admin` frontend: CRUD-style endpoints for models, tags, workflow templates/variants/params/tags.
- `app-cloud-api` — HTTP API exposed *by* the rented GPU instance (file upload/serving), called by the cloud-side orchestration.
- `app-cloud-cron` — cron jobs that run **on the rented GPU instance**: polls task-file directories (`GENERATE_TASKS_DIR`, `GENERATE_PROGRESS_TASKS_DIR`, `WORKFLOW_DIR`, `MODEL_INFO_DIR`, from `CloudAppSynthService`), downloads required models (from HuggingFace or Civitai) and input images (from Telegram) before a run, compiles the workflow via `WorkflowLibService.compileWorkflowSchema`, submits it to ComfyUI (`ComfyUiLibService.prompt`), tracks progress, and reports status/errors back to Telegram.
- `app-cli` / `app-cloud-cli` — Commander-based CLIs (`commander`) exposing the same synth/lib functionality as scriptable commands; `app-cli` runs locally/host-side, `app-cloud-cli` runs on the GPU instance (e.g. installing/starting ComfyUI, compiling/parsing workflows, creating models/workflow variants).

The base/cloud split reflects two machines: the always-on host running the Telegram bot + admin + light cron, and an ephemeral rented GPU instance running ComfyUI + the cloud API/cron/cli, communicating via task files on a shared/synced workspace directory (see `workspace/`) and direct HTTP/Telegram calls.

### Data model (Prisma, `prisma/schema.prisma`)

Postgres via `PrismaLibService` (extends `PrismaClient`, connects on module init). Key entities: `Users`, `WorkflowTemplates` -> `WorkflowVariants` -> `WorkflowVariantParams` (schema-level, admin-defined) and `WorkflowVariantUserParams` (per-user overrides), `UserWorkflowVariantRuns` (+ `WorkflowVariantRunParams`, dedup'd by params hash) tracking run status (`new`/`in_progress`/`completed`/`failed`), `Models` with `ModelHuggingfaceLinks`/`ModelCivitaiLinks`/`ModelTags`, generic `Tags`, `Settings` (key/value), `Locks` (key/value with expiry, used by `repo/lock` + `mutex.decorator.ts` for cron job mutual exclusion), `UserTextEdits`, and `TgBotSessions` (Telegraf session storage backed by Postgres instead of memory).

### Config / secrets

No secrets are committed; `.env.template` documents required vars (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `VAST_AI_API_KEY`, `RUNPOD_API_KEY`, `HF_TOKEN`, `TG_CHAT_ID`, `WORKSPACE`, ...). In deployment, secrets are pulled from Infisical (`bin/import-secrets.sh`, `bin/amvera-build.sh`) into `.env` at build/provision time.
