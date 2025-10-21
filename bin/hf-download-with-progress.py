# download_with_progress.py
import sys
import os
from huggingface_hub import hf_hub_download

# Сохраняем оригинальный tqdm
_original_tqdm = None

class LineTqdm:
    def __init__(self, *args, **kwargs):
        self.total = kwargs.get("total", 0)
        self.n = 0
        if self.total:
            percent = 0.0
            sys.stderr.write(f"PROGRESS:{percent:.1f}\n")
            sys.stderr.flush()

    def update(self, n=1):
        self.n += n
        if self.total:
            percent = min(100.0, 100 * self.n / self.total)
            sys.stderr.write(f"PROGRESS:{percent:.1f}\n")
            sys.stderr.flush()

    def close(self):
        sys.stderr.write("PROGRESS:100.0\n")
        sys.stderr.flush()

    def set_description(self, desc):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

# Подменяем tqdm в пространстве имён huggingface_hub
import tqdm as tqdm_module
_original_tqdm = tqdm_module.tqdm
tqdm_module.tqdm = LineTqdm

def download_with_progress(repo_id, filename, local_dir):
    try:
        hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            local_dir=local_dir,
        )
    finally:
        # Восстанавливаем tqdm (опционально)
        tqdm_module.tqdm = _original_tqdm

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python download_with_progress.py <repo_id> <filename> <local_dir>", file=sys.stderr)
        sys.exit(1)

    repo_id, filename, local_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    try:
        download_with_progress(repo_id, filename, local_dir)
    except Exception as e:
        print(f"ERROR:{str(e)}", file=sys.stderr)
        sys.exit(1)