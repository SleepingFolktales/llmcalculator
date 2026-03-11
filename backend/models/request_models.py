"""
Pydantic input schemas for API requests
"""

from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional, List


class ModelInstanceInput(BaseModel):
    """Single model instance input."""
    model_name: str = Field(..., description="Model name or search query, e.g. 'llama-3.1-70b'")
    n_instances: int = Field(1, ge=1, description="Number of parallel instances")
    context_tokens: int = Field(4096, ge=512, le=2_000_000, description="Context window per instance")
    quant_preference: Optional[str] = Field(None, description="Force a specific quantization (e.g. Q4_K_M)")
    precision_format: str = Field("fp16", description="Precision format ID (e.g. fp16, int8, q4_k_m, bitnet_1_58)")
    use_case: Literal["general", "coding", "reasoning", "chat", "embedding", "multimodal"] = "general"


class CalculationRequest(BaseModel):
    """Main calculation request."""
    model_instances: List[ModelInstanceInput] = Field(..., min_length=1)
    target_tps_per_instance: Optional[float] = Field(None, gt=0, description="Target tok/s per instance")
    total_target_tps: Optional[float] = Field(None, gt=0, description="Total system tok/s target")
    deployment_mode: Literal["concurrent", "sequential", "batched"] = "concurrent"
    budget_usd: Optional[float] = Field(None, gt=0, description="Maximum build cost in USD")
    include_cpu_paths: bool = True
    prefer_single_gpu: bool = True
    
    @field_validator("model_instances")
    @classmethod
    def at_least_one_instance(cls, v):
        if not v:
            raise ValueError("At least one model instance required")
        return v
