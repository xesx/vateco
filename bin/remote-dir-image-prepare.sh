#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:?Usage: $0 remote:path [--dry-run]}"
DRY_RUN="${2:-}"

# Примечание: скрипт совместим со старым bash 3.2 (дефолт на macOS),
# поэтому без ассоциативных массивов (declare -A) и без mapfile (bash 4+).

echo "Получаю список папок..."
DIRS=()
while IFS= read -r dir; do
    dir="${dir%/}"          # убрать трейлинг слэш
    DIRS+=("$dir")
done < <(rclone lsf "$REMOTE" -R --dirs-only)

echo "Найдено папок: ${#DIRS[@]}"
echo

# Сортируем по глубине: самые глубокие — первыми,
# чтобы переименование родителей не ломало пути детей
SORTED=()
while IFS= read -r dir; do
    SORTED+=("$dir")
done < <(
    for d in "${DIRS[@]}"; do
        depth=$(tr -dc '/' <<< "$d" | wc -c)
        printf '%d\t%s\n' "$depth" "$d"
    done | sort -rn | cut -f2-
)

for dir in "${SORTED[@]}"; do
    # считаем файлы (включая вложенные) прямо здесь, без предварительного кэша
    count=$(rclone lsf "$REMOTE/$dir" -R --files-only | wc -l | tr -d ' ')
    base="${dir##*/}"                       # имя папки без пути
    parent="${dir%"$base"}"                 # родительский путь (с "/" или пустой)

    # пропускаем, если уже переименована по этому шаблону
    if [[ "$base" =~ __[0-9]+$ ]]; then
        echo "SKIP  $dir (уже имеет счётчик)"
        continue
    fi

    new_name="${base}__${count}"
    src="$REMOTE/$dir"
    dst="$REMOTE/${parent}${new_name}"

    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        echo "DRY   $dir  ->  ${parent}${new_name}  ($count файлов)"
    else
        echo "MOVE  $dir  ->  ${parent}${new_name}  ($count файлов)"
        rclone moveto "$src" "$dst"
    fi
done

echo
echo "Готово."