#!/usr/bin/env python3
"""
Скрипт для скачивания файлов с HuggingFace в папку models ComfyUI.

Использование:
  python hf-download-file.py <url>

Пример URL:
  https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev.safetensors
  https://huggingface.co/black-forest-labs/FLUX.1-dev/blob/main/flux1-dev.safetensors
"""

import sys
import os
import subprocess
import re

# ─── Конфигурация ────────────────────────────────────────────────────────────
COMFYUI_PATH = "/workspace/ComfyUI"
# ─────────────────────────────────────────────────────────────────────────────

MODELS_PATH = os.path.join(COMFYUI_PATH, "models")


def parse_hf_url(url: str) -> tuple[str, str, str]:
    """
    Парсит URL HuggingFace и возвращает (repo_id, filename, revision).

    Поддерживаемые форматы:
      https://huggingface.co/{repo_id}/resolve/{revision}/{filename}
      https://huggingface.co/{repo_id}/blob/{revision}/{filename}
    """
    pattern = r"https://huggingface\.co/([^/]+/[^/]+)/(?:resolve|blob)/([^/]+)/(.+)"
    match = re.match(pattern, url.strip())
    if not match:
        raise ValueError(
            f"Не удалось распознать URL HuggingFace: {url}\n"
            "Ожидается формат: https://huggingface.co/<owner>/<repo>/resolve/<revision>/<path/to/file>"
        )
    repo_id = match.group(1)
    revision = match.group(2)
    filename = match.group(3)
    return repo_id, filename, revision


def pick_target_folder() -> str:
    """Интерактивно запрашивает у пользователя папку назначения внутри models."""
    if os.path.isdir(MODELS_PATH):
        all_folders = sorted(
            d for d in os.listdir(MODELS_PATH)
            if os.path.isdir(os.path.join(MODELS_PATH, d))
        )
    else:
        all_folders = []

    print("\nДоступные папки внутри models:")
    for i, folder in enumerate(all_folders, start=1):
        print(f"  {i:2}. {folder}")
    print(f"   0. Ввести путь вручную")

    while True:
        raw = input("\nВыберите номер папки (или 0 для ручного ввода): ").strip()
        if raw == "0":
            custom = input("Введите путь относительно папки models (например loras/flux): ").strip()
            if custom:
                return custom
            print("Путь не может быть пустым.")
        elif raw.isdigit() and 1 <= int(raw) <= len(all_folders):
            return all_folders[int(raw) - 1]
        else:
            print(f"Пожалуйста, введите число от 0 до {len(all_folders)}.")


def download(repo_id: str, filename: str, revision: str, target_subfolder: str) -> None:
    """Запускает hf download с HF_HUB_ENABLE_HF_TRANSFER=1."""
    dest_dir = os.path.join(MODELS_PATH, target_subfolder)
    os.makedirs(dest_dir, exist_ok=True)

    env = os.environ.copy()
    env["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

    cmd = [
        "hf", "download",
        repo_id,
        filename,
        "--revision", revision,
        "--local-dir", dest_dir,
    ]

    print(f"\n▶ Команда: {' '.join(cmd)}")
    print(f"▶ Папка назначения: {dest_dir}\n")

    result = subprocess.run(cmd, env=env)
    if result.returncode != 0:
        print(f"\n❌ Ошибка при скачивании (код {result.returncode}).")
        sys.exit(result.returncode)

    print(f"\n✅ Файл успешно скачан в: {dest_dir}")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        print("Ошибка: укажите URL файла на HuggingFace.")
        sys.exit(1)

    url = sys.argv[1]

    try:
        repo_id, filename, revision = parse_hf_url(url)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)

    print(f"  Репозиторий : {repo_id}")
    print(f"  Файл        : {filename}")
    print(f"  Ревизия     : {revision}")

    target_subfolder = pick_target_folder()
    download(repo_id, filename, revision, target_subfolder)


if __name__ == "__main__":
    main()

