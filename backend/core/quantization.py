"""
Quantization logic ported from llmfit models.rs
Defines quantization hierarchy, bytes-per-parameter, speed multipliers, and quality penalties.
"""

from typing import Dict, List

QUANT_HIERARCHY: List[str] = ["Q8_0", "Q6_K", "Q5_K_M", "Q4_K_M", "Q3_K_M", "Q2_K"]

QUANT_BPP: Dict[str, float] = {
    "F16": 2.0,
    "Q8_0": 1.05,
    "Q6_K": 0.80,
    "Q5_K_M": 0.68,
    "Q4_K_M": 0.58,
    "Q3_K_M": 0.48,
    "Q2_K": 0.37,
}

QUANT_BYTES_PER_PARAM: Dict[str, float] = {
    "F16": 2.0,
    "Q8_0": 1.06,
    "Q6_K": 0.81,
    "Q5_K_M": 0.69,
    "Q4_K_M": 0.59,
    "Q3_K_M": 0.49,
    "Q2_K": 0.38,
}

QUANT_SPEED_MULTIPLIER: Dict[str, float] = {
    "F16": 0.6,
    "Q8_0": 0.8,
    "Q6_K": 0.95,
    "Q5_K_M": 1.0,
    "Q4_K_M": 1.15,
    "Q3_K_M": 1.25,
    "Q2_K": 1.35,
}

QUANT_QUALITY_PENALTY: Dict[str, float] = {
    "F16": 0.0,
    "Q8_0": 0.0,
    "Q6_K": -1.0,
    "Q5_K_M": -3.0,
    "Q4_K_M": -5.0,
    "Q3_K_M": -8.0,
    "Q2_K": -12.0,
}


def quant_bpp(quant: str) -> float:
    """Bytes per parameter for storage size calculation."""
    return QUANT_BPP.get(quant, 0.58)


def quant_bytes_per_param(quant: str) -> float:
    """Bytes per parameter for bandwidth-based speed estimation."""
    return QUANT_BYTES_PER_PARAM.get(quant, 0.59)


def quant_speed_multiplier(quant: str) -> float:
    """Speed factor: lower quant = faster (less data to read)."""
    return QUANT_SPEED_MULTIPLIER.get(quant, 1.0)


def quant_quality_penalty(quant: str) -> float:
    """Quality penalty: Q8_0 = 0.0, Q4_K_M = -5.0, Q2_K = -12.0"""
    return QUANT_QUALITY_PENALTY.get(quant, -5.0)


def get_next_lower_quant(quant: str) -> str | None:
    """Get the next lower quality quantization in the hierarchy."""
    if quant not in QUANT_HIERARCHY:
        return None
    idx = QUANT_HIERARCHY.index(quant)
    if idx >= len(QUANT_HIERARCHY) - 1:
        return None
    return QUANT_HIERARCHY[idx + 1]


def get_best_quant() -> str:
    """Get the highest quality quantization."""
    return QUANT_HIERARCHY[0]


def quant_description(quant: str) -> str:
    """Human-readable description of quantization quality."""
    descriptions = {
        "F16": "Full precision (no compression)",
        "Q8_0": "8-bit quantization (minimal quality loss)",
        "Q6_K": "6-bit quantization (excellent quality)",
        "Q5_K_M": "5-bit quantization (very good quality)",
        "Q4_K_M": "4-bit quantization (good quality, recommended)",
        "Q3_K_M": "3-bit quantization (acceptable quality)",
        "Q2_K": "2-bit quantization (noticeable quality loss)",
    }
    return descriptions.get(quant, "Unknown quantization")
