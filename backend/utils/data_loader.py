"""
Data loader - loads and indexes JSON data files (models, GPUs, CPUs, RAM)
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from functools import lru_cache

DATA_DIR = Path(__file__).parent.parent.parent / "data"


class DataLoader:
    """Singleton data loader for all JSON databases."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.models: List[Dict] = []
        self.gpus: List[Dict] = []
        self.cpus: List[Dict] = []
        self.ram_specs: List[Dict] = []
        self.precision_formats: List[Dict] = []
        self.laptop_gpus: List[Dict] = []
        
        self.models_by_id: Dict[str, Dict] = {}
        self.gpus_by_id: Dict[str, Dict] = {}
        self.cpus_by_id: Dict[str, Dict] = {}
        self.precision_by_id: Dict[str, Dict] = {}
        self.laptop_gpus_by_id: Dict[str, Dict] = {}
        
        self._load_all()
        self._initialized = True
    
    def _load_all(self):
        """Load all JSON data files."""
        self._load_models()
        self._load_gpus()
        self._load_cpus()
        self._load_ram()
        self._load_precision_formats()
        self._load_laptop_hardware()
    
    def _load_models(self):
        """Load HuggingFace models database."""
        models_path = DATA_DIR / "hf_models.json"
        if models_path.exists():
            with open(models_path, 'r', encoding='utf-8') as f:
                self.models = json.load(f)
            
            for model in self.models:
                model_id = model.get("name", "").lower().replace("/", "-").replace(" ", "-")
                self.models_by_id[model_id] = model
    
    def _load_gpus(self):
        """Load GPU specifications database."""
        gpus_path = DATA_DIR / "gpu_specs.json"
        if gpus_path.exists():
            with open(gpus_path, 'r', encoding='utf-8') as f:
                self.gpus = json.load(f)
            
            for gpu in self.gpus:
                self.gpus_by_id[gpu["id"]] = gpu
    
    def _load_cpus(self):
        """Load CPU specifications database."""
        cpus_path = DATA_DIR / "cpu_specs.json"
        if cpus_path.exists():
            with open(cpus_path, 'r', encoding='utf-8') as f:
                self.cpus = json.load(f)
            
            for cpu in self.cpus:
                self.cpus_by_id[cpu["id"]] = cpu
    
    def _load_ram(self):
        """Load RAM specifications database."""
        ram_path = DATA_DIR / "ram_specs.json"
        if ram_path.exists():
            with open(ram_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.ram_specs = data.get("ram_specs", [])
    
    def _load_precision_formats(self):
        """Load precision/quantization formats database."""
        precision_path = DATA_DIR / "precision_formats.json"
        if precision_path.exists():
            with open(precision_path, 'r', encoding='utf-8') as f:
                self.precision_formats = json.load(f)
            
            for precision in self.precision_formats:
                self.precision_by_id[precision["id"]] = precision
    
    def _load_laptop_hardware(self):
        """Load laptop GPU/SoC hardware database."""
        laptop_path = DATA_DIR / "laptop_hardware.json"
        if laptop_path.exists():
            with open(laptop_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.laptop_gpus = data.get("gpus", [])
            
            for gpu in self.laptop_gpus:
                self.laptop_gpus_by_id[gpu["id"]] = gpu
    
    def get_all_models(self) -> List[Dict]:
        """Get all models."""
        return self.models
    
    def get_all_gpus(self) -> List[Dict]:
        """Get all GPUs."""
        return self.gpus
    
    def get_all_cpus(self) -> List[Dict]:
        """Get all CPUs."""
        return self.cpus
    
    def get_all_precision_formats(self) -> List[Dict]:
        """Get all precision formats."""
        return self.precision_formats
    
    def get_model_by_id(self, model_id: str) -> Optional[Dict]:
        """Get model by exact ID match."""
        return self.models_by_id.get(model_id)
    
    def get_gpu_by_id(self, gpu_id: str) -> Optional[Dict]:
        """Get GPU by exact ID match."""
        return self.gpus_by_id.get(gpu_id)
    
    def get_cpu_by_id(self, cpu_id: str) -> Optional[Dict]:
        """Get CPU by exact ID match."""
        return self.cpus_by_id.get(cpu_id)
    
    def get_precision_by_id(self, precision_id: str) -> Optional[Dict]:
        """Get precision format by exact ID match."""
        return self.precision_by_id.get(precision_id)
    
    def get_all_laptop_gpus(self) -> List[Dict]:
        """Get all laptop GPUs."""
        return self.laptop_gpus
    
    def get_laptop_gpu_by_id(self, gpu_id: str) -> Optional[Dict]:
        """Get laptop GPU by exact ID match."""
        return self.laptop_gpus_by_id.get(gpu_id)
    
    def search_models(self, query: str, limit: int = 20) -> List[Dict]:
        """Fuzzy search for models."""
        query_lower = query.lower()
        
        results = []
        for model in self.models:
            name = model.get("name", "").lower()
            provider = model.get("provider", "").lower()
            param_count = model.get("parameter_count", "").lower()
            
            score = 0
            if query_lower in name:
                score += 10
            if query_lower in provider:
                score += 5
            if query_lower in param_count:
                score += 7
            
            if score > 0:
                results.append((score, model))
        
        results.sort(key=lambda x: x[0], reverse=True)
        return [model for _, model in results[:limit]]
    
    def search_gpus(self, query: str, limit: int = 20) -> List[Dict]:
        """Fuzzy search for GPUs."""
        query_lower = query.lower()
        
        results = []
        for gpu in self.gpus:
            name = gpu.get("name", "").lower()
            brand = gpu.get("brand", "").lower()
            
            if query_lower in name or query_lower in brand:
                results.append(gpu)
        
        return results[:limit]


@lru_cache(maxsize=1)
def get_data_loader() -> DataLoader:
    """Get singleton data loader instance."""
    return DataLoader()
