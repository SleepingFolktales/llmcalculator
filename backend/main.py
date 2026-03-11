"""
FastAPI application entry point
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes_calculate import router as calc_router
from api.routes_models import router as models_router
from api.routes_hardware import router as hardware_router
from api.routes_precision import router as precision_router
from utils.data_loader import get_data_loader


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load all JSON data into memory."""
    print("Loading data files...")
    loader = get_data_loader()
    print(f"Loaded {len(loader.get_all_models())} models")
    print(f"Loaded {len(loader.get_all_gpus())} desktop GPUs")
    print(f"Loaded {len(loader.get_all_laptop_gpus())} laptop GPUs")
    print(f"Loaded {len(loader.get_all_supercomputers())} supercomputers/AI accelerators")
    print(f"Loaded {len(loader.get_all_cpus())} CPUs")
    print(f"Loaded {len(loader.ram_specs)} RAM specs")
    print(f"Loaded {len(loader.get_all_precision_formats())} precision formats")
    print("Server ready!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="LLMCalculator",
    version="1.0.0",
    description="Calculate hardware requirements for running LLM models",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calc_router, prefix="/api", tags=["Calculate"])
app.include_router(models_router, prefix="/api", tags=["Models"])
app.include_router(hardware_router, prefix="/api", tags=["Hardware"])
app.include_router(precision_router, prefix="/api", tags=["Precision"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "LLMCalculator API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    loader = get_data_loader()
    return {
        "status": "healthy",
        "models_loaded": len(loader.get_all_models()),
        "desktop_gpus_loaded": len(loader.get_all_gpus()),
        "laptop_gpus_loaded": len(loader.get_all_laptop_gpus()),
        "cpus_loaded": len(loader.get_all_cpus()),
        "precision_formats_loaded": len(loader.get_all_precision_formats()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
