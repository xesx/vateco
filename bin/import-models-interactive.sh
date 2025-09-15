#!/bin/bash
set -e

REMOTE="ydisk"
BASE_REMOTE_PATH="shared/comfyui/models/"
LOCAL_DEST="/workspace/ComfyUI/models/"

echo "📁 Сканируем доступные папки..."

# Получаем список подкаталогов внутри BASE_REMOTE_PATH (без файлов)
FOLDERS=()
while IFS= read -r line; do
  FOLDERS+=("${line%/}") # убираем / с конца
done < <(rclone lsf "${REMOTE}:${BASE_REMOTE_PATH}" --dirs-only)

if [[ ${#FOLDERS[@]} -eq 0 ]]; then
  echo "❌ Нет папок в ${REMOTE}:${BASE_REMOTE_PATH}"
  exit 1
fi

# Выбор папки через fzf
SELECTED_FOLDER=$(printf '%s\n' "${FOLDERS[@]}" | \
  fzf --prompt="📂 Выбери папку: " --header="Enter — открыть папку" --reverse)

if [[ -z "$SELECTED_FOLDER" ]]; then
  echo "🚪 Отменено пользователем."
  exit 0
fi

REMOTE_PATH="${BASE_REMOTE_PATH}${SELECTED_FOLDER}/"
echo "📂 Открыта папка: ${REMOTE_PATH}"

# Получаем список всех файлов (рекурсивно) внутри выбранной папки
FILES=()
while IFS= read -r line; do
  FILES+=("$line")
done < <(rclone lsf -R "${REMOTE}:${REMOTE_PATH}" --files-only)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "❌ Нет файлов в ${REMOTE}:${REMOTE_PATH}"
  exit 1
fi

# Выбор файлов (с сохранением вложенности)
SELECTED_FILES=$(printf '%s\n' "${FILES[@]}" | \
  fzf --multi --ansi --marker='++' \
      --prompt="📄 Выбери файлы: " \
      --header="⇧↑↓ Tab — выбрать, Enter — скачать" \
      --reverse)

if [[ -z "$SELECTED_FILES" ]]; then
  echo "🚪 Отменено пользователем."
  exit 0
fi

echo "⬇️ Загружаем выбранные файлы с сохранением структуры..."

while IFS= read -r FILE; do
  SRC="${REMOTE}:${REMOTE_PATH}${FILE}"
  DEST="${LOCAL_DEST}${SELECTED_FOLDER}/${FILE}"
  echo "📥 $SRC → $DEST"
  rclone copyto -P "$SRC" "$DEST"
done <<< "$SELECTED_FILES"

echo "✅ Загрузка завершена!"
