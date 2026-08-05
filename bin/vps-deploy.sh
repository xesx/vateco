#!/bin/bash
# Прод-деплой на VPS: подтягивает свежий master (жёстко, невзирая на конфликты),
# качает секреты из Infisical в .env, ставит зависимости, накатывает миграции,
# билдит и (пере)запускает приложение через pm2.
#
# Требует INFISICAL_TOKEN (берётся из окружения или из .env.infisical).
set -uo pipefail

# Гарантируем, что node/npm/npx есть в PATH независимо от того, как запущен
# скрипт (интерактивный логин, `ssh host "команда"`, cron и т.п.) —
# неинтерактивный shell не читает .bashrc, где обычно инициализируется nvm.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  \. "$NVM_DIR/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ node не найден в PATH (проверь установку node/nvm на сервере)" >&2
  exit 1
fi

deploy() {
  cd "$(dirname "$0")/.." || { echo "❌ не удалось перейти в директорию проекта" >&2; return 1; }

  BRANCH="${BRANCH:-master}"
  API_URL="https://us.infisical.com/api/v3/secrets/raw"

  # INFISICAL_TOKEN может лежать в .env.infisical
  if [ -z "${INFISICAL_TOKEN:-}" ] && [ -f .env.infisical ]; then
    # shellcheck disable=SC1091
    source .env.infisical
  fi

  if [ -z "${INFISICAL_TOKEN:-}" ]; then
    echo "❌ INFISICAL_TOKEN не задан (ни в окружении, ни в .env.infisical)" >&2
    return 1
  fi

  echo "==> Подтягиваю свежий $BRANCH (hard reset, конфликты игнорируются)"
  git fetch origin "$BRANCH" || { echo "❌ git fetch failed" >&2; return 1; }
  git checkout "$BRANCH" || { echo "❌ git checkout failed" >&2; return 1; }
  git reset --hard "origin/$BRANCH" || { echo "❌ git reset failed" >&2; return 1; }
  git clean -fd || { echo "❌ git clean failed" >&2; return 1; }

  echo "==> Качаю секреты из Infisical в .env"
  response=$(curl -sf -H "Authorization: Bearer $INFISICAL_TOKEN" "$API_URL") \
    || { echo "❌ запрос к Infisical failed" >&2; return 1; }

  echo "$response" | node -e '
    const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
    if (!Array.isArray(data.secrets)) {
      console.error("Ответ Infisical не содержит secrets:", JSON.stringify(data));
      process.exit(1);
    }
    for (const s of data.secrets)
      console.log(`${s.secretKey}="${s.secretValue}"`);
  ' > .env || { echo "❌ не удалось разобрать секреты Infisical" >&2; return 1; }

  set -a
  # shellcheck disable=SC1091
  source .env
  set +a

  echo "Секреты загружены:"
  echo "$response" | node -e '
    const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
    for (const s of data.secrets) console.log(s.secretKey);
  '

  echo "==> Ставлю зависимости"
  npm ci || { echo "❌ npm ci failed" >&2; return 1; }

  echo "==> Генерирую Prisma client и накатываю миграции"
  npx prisma generate || { echo "❌ prisma generate failed" >&2; return 1; }
  npm run migrate:deploy || { echo "❌ migrate:deploy failed" >&2; return 1; }
  echo "Migrations deployed successfully"

  echo "==> Билдю приложение"
  npm run build || { echo "❌ build failed" >&2; return 1; }
  echo "Build completed successfully"

  echo "==> (Пере)запускаю pm2 my-tg-bot"
  npx pm2 startOrReload ecosystem.config.js --only "my-tg-bot" --update-env \
    || { echo "❌ pm2 startOrReload failed" >&2; return 1; }
  npx pm2 save || { echo "❌ pm2 save failed" >&2; return 1; }

  echo "==> Деплой завершён"
  return 0
}

if deploy; then
  status=0
else
  status=$?
  echo "❌ Деплой завершился с ошибкой (код $status)" >&2
fi

exit "$status"