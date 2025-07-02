def track_wallet_activity(wallets):
    for w in wallets:
        print(f"Wallet {w['address']} performed {w['tx_count']} txs in last 24h")

if __name__ == "__main__":
    tracked = [
        {"address": "Wallet1", "tx_count": 30},
        {"address": "Wallet2", "tx_count": 212},
        {"address": "Wallet3", "tx_count": 8},
    ]
    track_wallet_activity(tracked)