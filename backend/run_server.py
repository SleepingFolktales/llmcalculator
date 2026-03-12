"""
Simple server runner.

Port resolution order:
  1. --port CLI argument
  2. PORT environment variable
  3. Default: 8000
"""

import os
import sys
import argparse
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LLMCalculator backend server")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PORT", 8000)),
        help="Port to listen on (default: PORT env var or 8000)",
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("HOST", "127.0.0.1"),
        help="Host to bind to (default: HOST env var or 127.0.0.1)",
    )
    args = parser.parse_args()

    import uvicorn
    from main import app

    print(f"Starting LLMCalculator backend on {args.host}:{args.port} ...")
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        reload=False,
        log_level="info",
    )
