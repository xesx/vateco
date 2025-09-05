#!/bin/bash
# Базовый URL API
API_URL="https://us.infisical.com/api/v3/secrets/raw"

# Получаем JSON с секретами
response=$(curl -s -H "Authorization: Bearer $INFISICAL_TOKEN" "$API_URL")

# Проходим по каждому секрету и экспортируем переменную
echo "$response" | jq -r '.secrets[] | "export \(.secretKey)=\(.secretValue)"' >> ${WORKSPACE}/onstart.sh
echo "$response" | jq -r '.secrets[] | "\(.secretKey)=\(.secretValue)"' > ${WORKSPACE}/vateco/.env
source ${WORKSPACE}/onstart.sh

# Опционально: показать, что переменные установились
echo "Секреты загружены:"
jq -r '.secrets[].secretKey' <<< "$response"
