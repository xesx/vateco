# Code style rules

Правила код стайла для этого репозитория.

## Форматирование (enforced by `.prettierrc` / `eslint.config.mjs`)

- Без точек с запятой (`semi: false`).
- Одинарные кавычки (`singleQuote: true`).
- Висячие запятые везде, где допустимо синтаксисом (`trailingComma: "all"`).
- `any` разрешён явно (`@typescript-eslint/no-explicit-any: off`), большинство `no-unsafe-*` правил выключены — не боремся со строгостью TS на динамических данных (workflow schema, task files, API payloads из внешних сервисов). Не добавляй лишние type guards/касты ради подавления линтера там, где данные заведомо untyped JSON.
- Перед коммитом код должен пройти `npm run lint` и `npm run format` без ручных правок форматирования (эти команды сами всё поправят через `--fix`/`--write`).

## Именование файлов и классов по слою

Суффикс жёстко привязан к директории — не смешивай:

| Директория | Суффикс файла | Пример |
|---|---|---|
| `libs/*` | `*.lib.service.ts`, `*.lib.module.ts` | `comfy-ui.lib.service.ts` |
| `repo/*` | `*.repository.ts`, `*.repository.module.ts` | `user.repository.ts` |
| `synth/*` | `*.synth.service.ts`, `*.synth.module.ts` | `workflow-compiler.synth.service.ts` |
| `apps/*-cron` | `*.cron-job.ts` | `check-generating-queue.cron-job.ts` |
| `apps/app-cli`, `apps/app-cloud-cli` | `*.cli.ts` | — |
| `apps/app-base-tg-bot`, `apps/app-gp-tg-bot` | `*.tg-bot.service.ts` | — |

Новый файл в одной из этих зон — смотри на соседние файлы в той же директории и повторяй суффикс/структуру (module + service + barrel `index.ts`), а не придумывай свою схему.

## Logger convention

Каждый сервисный класс создаёт приватный логгер по имени класса:

```ts
private readonly l = new Logger(ComfyUiLibService.name)
```

Сообщения логов начинаются с тега (лог-маркера) который формируется следующим образом:
[ClassName]_[MethodName]_[to digits for uniqueness] — например:

```ts
this.l.log('ComfyUiLibService_handleWorkflow_12 ...', { args })
this.l.error('ComfyUiLibService_handleWorkflow_12 some error', { args }, err)
```
Это нужно, чтобы их было легко грепать в проде:

Не используй `console.log` в коде приложения — только `this.l`.

## Барреллы и импорты между слоями

- Каждый саб-пакет (`libs/openai`, `repo/user`, `synth/workflow`, ...) экспортирует себя через собственный `index.ts`.
- Добавляя новый саб-пакет — обязательно добавь реэкспорт в родительский barrel (`libs/index.ts`, `repo/index.ts`, `synth/index.ts`).
- В коде приложений (`apps/*`) слои импортируются целиком через namespace-импорт и вызываются через него:

```ts
import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

lib.SomeLibService
repo.SomeRepository
synth.SomeSynthService
```

Не импортируй напрямую из глубоких путей (`@lib/comfy-ui/src/...`) в коде `apps/*` — только через barrel.

## Общие принципы (см. также корневой CLAUDE.md)

- Не добавляй абстракции/error handling/валидацию для сценариев, которых не может произойти — доверяй внутренним гарантиям кода и Nest DI.
- Не переименовывай/не оставляй backwards-compat заглушки (неиспользуемые `_var`, `// removed` комментарии) — если что-то не используется, удаляй целиком.
- Комментарии — только когда неочевидна причина (WHY), не описание того, что и так видно из кода.
