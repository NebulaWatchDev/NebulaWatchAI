import requests

def get_recent_spl_accounts(limit=5):
    url = "https://api.mainnet-beta.solana.com"
    headers = {"Content-Type": "application/json"}
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getProgramAccounts",
        "params": [
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            {
                "encoding": "jsonParsed",
                "filters": [
                    {"dataSize": 165}
                ]
            }
        ]
    }
    res = requests.post(url, json=payload, headers=headers)
    data = res.json().get("result", [])[:limit]
    return [acct["pubkey"] for acct in data]

if __name__ == "__main__":
    accounts = get_recent_spl_accounts()
    for a in accounts:
        print("Detected account:", a)