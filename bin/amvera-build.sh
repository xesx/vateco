#!/bin/bash
# Build the project
nest build

# Make CLI executable
chmod +x dist/apps/app-cli/src/cli.js

echo "Build completed successfully"

# Базовый URL API
API_URL="https://us.infisical.com/api/v3/secrets/raw"

source .env.amvera

# Получаем JSON с секретами
response=$(curl -s -H "Authorization: Bearer $INFISICAL_TOKEN" "$API_URL")

echo "--->>>>>>>>> response $response"
echo "--->>>>>>>>>INFISICAL_TOKEN $INFISICAL_TOKEN"

#echo "$response" | jq -r '.secrets[] | "\(.secretKey)=\(.secretValue)"' > .env
echo "$response" \
  | sed -n 's/.*"secretKey":"\([^"]*\)".*"secretValue":"\([^"]*\)".*/\1=\2/p' \
  > .env
source .env
echo "Секреты загружены:"
echo $(cat .env)

DATABASE_URL=$DATABASE_URL npm run migrate:deploy
echo "Migrations deployed successfully"
