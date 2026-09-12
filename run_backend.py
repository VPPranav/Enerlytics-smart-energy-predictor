import os
import sys
import traceback

# Ensure workspace root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

print(f"[run_backend] Python executable: {sys.executable}", flush=True)
print(f"[run_backend] Base directory: {BASE_DIR}", flush=True)

try:
    print("[run_backend] Importing backend.app.main...", flush=True)
    from backend.app.main import app
    import uvicorn
    print("[run_backend] Starting uvicorn server on http://127.0.0.1:8000 ...", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
except Exception as e:
    print(f"[run_backend] Fatal error during startup: {e}", flush=True)
    traceback.print_exc()
