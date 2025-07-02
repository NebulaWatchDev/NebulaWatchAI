
from typing import List, Dict

class TokenEvent:
    def __init__(self, symbol: str, tx_count: int, flagged: int):
        self.symbol = symbol
        self.tx_count = tx_count
        self.flagged = flagged

    def anomaly_ratio(self) -> float:
        return self.flagged / self.tx_count if self.tx_count else 0.0

def flag_anomalous_tokens(events: List[TokenEvent], threshold: float = 0.12) -> List[str]:
    suspicious = []
    for event in events:
        if event.anomaly_ratio() > threshold:
            suspicious.append(event.symbol)
    return suspicious

def summarize_flagged(events: List[TokenEvent]) -> Dict[str, float]:
    return {e.symbol: round(e.anomaly_ratio(), 4) for e in events}
