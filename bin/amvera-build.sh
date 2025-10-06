#!/bin/bash
# Build the project
nest build

# Make CLI executable
chmod +x dist/apps/app-cli/src/cli.js

echo "Build completed successfully"

# Базовый URL API
API_URL="https://us.infisical.com/api/v3/secrets/raw"

# Получаем JSON с секретами
response=$(curl -s -H "Authorization: Bearer $INFISICAL_TOKEN" "$API_URL")

echo "$response" | jq -r '.secrets[] | "\(.secretKey)=\(.secretValue)"' > .env
source .env
cat .env
echo "Секреты загружены:"

npm run migrate:deploy
echo "Migrations deployed successfully"
