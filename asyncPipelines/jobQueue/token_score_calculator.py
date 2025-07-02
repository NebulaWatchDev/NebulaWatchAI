
import math
from typing import List, Dict

def score_token(token: Dict[str, float]) -> float:
    score = (
        0.4 * math.log1p(token.get("volume_24h", 0)) +
        0.3 * token.get("price_change", 0) +
        0.2 * math.sqrt(token.get("tx_count", 1)) +
        0.1 * token.get("liquidity", 0)
    )
    return round(score, 2)

def rank_tokens(tokens: List[Dict[str, float]]) -> List[Dict[str, float]]:
    scored = []
    for token in tokens:
        token["score"] = score_token(token)
        scored.append(token)
    return sorted(scored, key=lambda x: x["score"], reverse=True)
