def detect_token_events(history):
    spikes = [h for h in history if h["volume"] > 50000]
    return [{"token": h["symbol"], "volume": h["volume"]} for h in spikes]

def print_signals(events):
    for e in events:
        print(f"🚨 Signal: {e['token']} high volume — {e['volume']}")

if __name__ == "__main__":
    sample_data = [
        {"symbol": "SOL", "volume": 12000},
        {"symbol": "RAY", "volume": 53000},
        {"symbol": "BONK", "volume": 70000},
    ]
    events = detect_token_events(sample_data)
    print_signals(events)