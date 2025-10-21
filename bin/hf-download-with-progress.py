# download_with_progress.py
import sys
import json
import os
from huggingface_hub import hf_hub_download
from tqdm.auto import tqdm

# Отключаем tqdm-анимацию, но оставляем построчный вывод
class LineTqdm(tqdm):
    def display(self, msg=None, pos=None):
        # Выводим только одну строку с процентами
        if self.total:
            percent = 100 * self.n / self.total
            sys.stderr.write(f"PROGRESS:{percent:.1f}\n")
            sys.stderr.flush()

def download_with_progress(repo_id, filename, local_dir):
    hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        local_dir=local_dir,
        tqdm_class=LineTqdm
    )
    sys.stderr.write("PROGRESS:100.0\n")
    sys.stderr.flush()

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