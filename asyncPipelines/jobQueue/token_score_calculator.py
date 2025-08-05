import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

ScoreWeights = Dict[str, float]

# Default weights for each metric (must sum to 1.0)
DEFAULT_WEIGHTS: ScoreWeights = {
    "volume_24h": 0.4,
    "price_change": 0.3,
    "tx_count": 0.2,
    "liquidity": 0.1,
}

@dataclass
class TokenStats:
    volume_24h: float = 0.0
    price_change: float = 0.0
    tx_count: float = 0.0
    liquidity: float = 0.0
    score: float = field(init=False, default=0.0)

    def compute_score(self, weights: Optional[ScoreWeights] = None) -> float:
        """
        Compute a weighted composite score:
          score = w1*log1p(volume_24h) + w2*price_change +
                  w3*sqrt(tx_count)   + w4*liquidity
        Weights must sum to 1.0; defaults to DEFAULT_WEIGHTS.
        """
        w = weights or DEFAULT_WEIGHTS
        # ensure weights sum to 1.0
        total_w = sum(w.values())
        if not math.isclose(total_w, 1.0):
            raise ValueError(f"Weights must sum to 1.0, got {total_w}")

        score = (
            w["volume_24h"]    * math.log1p(self.volume_24h) +
            w["price_change"]  * self.price_change +
            w["tx_count"]      * math.sqrt(self.tx_count) +
            w["liquidity"]     * self.liquidity
        )
        self.score = round(score, 2)
        return self.score

def rank_tokens(
    tokens: List[Dict[str, Any]],
    weights: Optional[ScoreWeights] = None
) -> List[Dict[str, Any]]:
    """
    Score and sort list of token metric dicts.
    Each dict must contain keys:
      'volume_24h', 'price_change', 'tx_count', 'liquidity'
    Returns a new list of dicts with an added 'score' key,
    sorted descending by score.
    """
    w = weights or DEFAULT_WEIGHTS
    ranked: List[Dict[str, Any]] = []

    for token in tokens:
        # extract metrics with defaults
        stats = TokenStats(
            volume_24h   = float(token.get("volume_24h", 0)),
            price_change = float(token.get("price_change", 0)),
            tx_count     = float(token.get("tx_count", 0)),
            liquidity    = float(token.get("liquidity", 0)),
        )
        score = stats.compute_score(w)
        # copy original dict and append score
        entry = token.copy()
        entry["score"] = score
        ranked.append(entry)

    # sort by score descending
    return sorted(ranked, key=lambda x: x["score"], reverse=True)
