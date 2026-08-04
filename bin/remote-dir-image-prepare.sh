#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:?Usage: $0 remote:path [--dry-run]}"
DRY_RUN="${2:-}"

MAX_FILES=200

# Примечание: скрипт совместим со старым bash 3.2 (дефолт на macOS),
# поэтому без ассоциативных массивов (declare -A) и без mapfile (bash 4+).

# Читает список папок (рекурсивно) в глобальный массив DIRS
read_dirs() {
    DIRS=()
    while IFS= read -r dir; do
        dir="${dir%/}"          # убрать трейлинг слэш
        DIRS+=("$dir")
    done < <(rclone lsf "$REMOTE" -R --dirs-only)
}

# Разбивает содержимое папки на подпапки part_N по MAX_FILES файлов,
# если файлов (лежащих непосредственно в папке) больше MAX_FILES.
split_dir() {
    local dir="$1"

    local files=()
    while IFS= read -r f; do
        files+=("$f")
    done < <(rclone lsf "$REMOTE/$dir" --files-only)

    local total=${#files[@]}
    if (( total <= MAX_FILES )); then
        return
    fi

    echo "SPLIT $dir ($total файлов) -> части по $MAX_FILES"

    local i=0 part=0
    while (( i < total )); do
        part=$((part + 1))
        local sub="part_${part}"

        # набираем до MAX_FILES имён файлов в список для rclone --files-from
        local listfile
        listfile=$(mktemp)
        local j=0
        while (( j < MAX_FILES && i < total )); do
            printf '%s\n' "${files[$i]}" >> "$listfile"
            i=$((i + 1))
            j=$((j + 1))
        done

        if [[ "$DRY_RUN" == "--dry-run" ]]; then
            echo "  DRY   $sub <- $j файлов"
        else
            echo "  MOVE  $sub <- $j файлов"
            rclone move "$REMOTE/$dir" "$REMOTE/$dir/$sub" \
                --files-from "$listfile" --no-traverse
        fi
        rm -f "$listfile"
    done
}

echo "Получаю список папок..."
read_dirs
echo "Найдено папок: ${#DIRS[@]}"
echo

# --- Пас 1: разбивка папок с числом файлов > MAX_FILES ---
echo "Проверяю папки на переполнение (> $MAX_FILES файлов)..."
for dir in "${DIRS[@]}"; do
    split_dir "$dir"
done
echo

# После разбивки появились новые подпапки part_N — перечитываем список
read_dirs

# --- Пас 2: переименование с суффиксом-счётчиком ---
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
