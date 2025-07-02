import requests
from typing import List, Dict

SOLANA_RPC = "https://api.mainnet-beta.solana.com"

def fetch_recent_accounts(limit: int = 10) -> List[Dict]:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getProgramAccounts",
        "params": [
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            {
                "encoding": "jsonParsed",
                "filters": [
                    {"memcmp": {"offset": 0, "bytes": "So11111111111111111111111111111111111111112"}}
                ]
            }
        ]
    }
    response = requests.post(SOLANA_RPC, json=payload)
    accounts = response.json()["result"]
    return accounts[:limit]

def display_new_accounts():
    new_accounts = fetch_recent_accounts()
    for acct in new_accounts:
        print(f"Owner: {acct['account']['data']['parsed']['info']['owner']}")

if __name__ == "__main__":
    display_new_accounts()
