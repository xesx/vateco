#!/bin/bash
# Прод-деплой на VPS: подтягивает свежий master (жёстко, невзирая на конфликты),
# качает секреты из Infisical в .env, ставит зависимости, накатывает миграции,
# билдит и (пере)запускает приложение через pm2.
#
# Требует INFISICAL_TOKEN (берётся из окружения или из .env.infisical).
set -uo pipefail

deploy() {
  set -e
  trap 'set +e' RETURN

  cd "$(dirname "$0")/.."

  BRANCH="${BRANCH:-master}"
  API_URL="https://us.infisical.com/api/v3/secrets/raw"

  # INFISICAL_TOKEN может лежать в .env.infisical
  if [ -z "${INFISICAL_TOKEN:-}" ] && [ -f .env.infisical ]; then
    source .env.infisical
  fi

  if [ -z "${INFISICAL_TOKEN:-}" ]; then
    echo "INFISICAL_TOKEN не задан (ни в окружении, ни в .env.infisical)" >&2
    return 0
  fi

  echo "==> Подтягиваю свежий $BRANCH (hard reset, конфликты игнорируются)"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -fd

  echo "==> Качаю секреты из Infisical в .env"
  response=$(curl -s -H "Authorization: Bearer $INFISICAL_TOKEN" "$API_URL")
  echo "$response" | node -e '
    const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
    if (!Array.isArray(data.secrets)) {
      console.error("Ответ Infisical не содержит secrets:", JSON.stringify(data));
      process.exit(1);
    }
    for (const s of data.secrets)
      console.log(`${s.secretKey}="${s.secretValue}"`);
  ' > .env
  set -a
  source .env
  set +a
  echo "Секреты загружены:"
  echo "$response" | node -e '
    const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
    for (const s of data.secrets) console.log(s.secretKey);
  '

  echo "==> Ставлю зависимости"
  npm ci

  echo "==> Генерирую Prisma client и накатываю миграции"
  npx prisma generate
  npm run migrate:deploy
  echo "Migrations deployed successfully"

  echo "==> Билдю приложение"
  npm run build
  echo "Build completed successfully"

  echo "==> (Пере)запускаю pm2 my-tg-bot"
  npx pm2 startOrReload ecosystem.config.js --only "my-tg-bot" --update-env
  npx pm2 save

  echo "==> Деплой завершён"
}

if deploy; then
  status=0
else
  status=$?
  echo "❌ Деплой завершился с ошибкой (код $status), шелл не закрываю" >&2
fi
