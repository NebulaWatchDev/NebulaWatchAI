def evaluate_liquidity(tokens):
    for token in tokens:
        change = token["liq_after"] - token["liq_before"]
        percent = (change / token["liq_before"]) * 100 if token["liq_before"] > 0 else 0
        print(f"{token['symbol']}: Liquidity changed by {percent:.2f}%")

if __name__ == "__main__":
    token_snapshots = [
        {"symbol": "SOL", "liq_before": 200000, "liq_after": 180000},
        {"symbol": "USDC", "liq_before": 500000, "liq_after": 510000},
    ]
    evaluate_liquidity(token_snapshots)