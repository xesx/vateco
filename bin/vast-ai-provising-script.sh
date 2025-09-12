#!/bin/bash

RCLONE_CONFIG_DIR="${HOME}/.config/rclone"
RCLONE_CONFIG_FILE="${RCLONE_CONFIG_DIR}/rclone.conf"

git clone https://github.com/xesx/vateco.git

# Импортируем секреты из Infisical
source ./vateco/bin/import-secrets.sh

# Packages are installed after nodes so we can fix them...

APT_PACKAGES=(
    "fzf"
)

# Make rclone config
mkdir -p "${RCLONE_CONFIG_DIR}"

cat > "${RCLONE_CONFIG_FILE}" <<EOF
[ydisk]
type = yandex
token = {"access_token":"$YANDEX_DISK_ACCESS_TOKEN","token_type":"OAuth","refresh_token":"$YANDEX_DISK_REFRESH_TOKEN","expiry":"$YANDEX_DISK_TOKEN_EXPIRY"}
EOF

# Запуск rclone API-сервера без авторизации на порту 5572
nohup rclone rcd --rc-addr=:5572 --rc-no-auth > /var/log/rclone.log 2>&1 &

function provisioning_start() {
    printf "\n##############################################\n#                                            #\n#          Provisioning container            #\n#                                            #\n#         This will take some time           #\n#                                            #\n# Your container will be ready on completion #\n#                                            #\n##############################################\n\n"

    provisioning_get_apt_packages

    deploy_cloud_apps

    cd ${WORKSPACE}/vateco
    node ${WORKSPACE}/vateco/dist/apps/app-cli/src/cli.js install-comfyui-v0 > ${WORKSPACE}/install-comfyui-v0.log 2>&1

    printf "\nProvisioning complete:  Application will start now\n\n"
}

function provisioning_get_apt_packages() {
    if [[ -n $APT_PACKAGES ]]; then
            sudo apt install "${APT_PACKAGES[@]}"
    fi
}

deploy_cloud_apps() {
    cd ${WORKSPACE}/vateco

    source /opt/nvm/nvm.sh
    nvm use 22

    # Установка зависимостей
    npm install

    # Сборка проекта
    npm run build

    # Запуск приложения cloud-app-api и cloud-app-cron в pm2
    npm run start:cloud:prod

    cd ${WORKSPACE}
}

provisioning_start
