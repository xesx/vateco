# inspect_lora.py
from safetensors import safe_open
import sys

path = sys.argv[1]
with safe_open(path, framework="pt") as f:
    print("=== METADATA ===")
    print(f.metadata() or "No metadata")
    print("\n=== TENSORS (first 10) ===")
    for i, key in enumerate(f.keys()):
        if i >= 10:
            print("...")
            break
        print(f"{key}: {f.get_tensor(key).shape}")