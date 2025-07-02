
import requests

def analyze_token_depth(mint_address):
    url = f"https://api.dexscreener.io/latest/dex/tokens/{mint_address}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        liquidity = data.get("liquidity", {}).get("usd", 0)
        holders = data.get("holders", 0)
        volatility = data.get("volatility", 0)
        return {
            "liquidity_usd": liquidity,
            "holders": holders,
            "volatility": volatility
        }
    return {"error": "Failed to fetch token depth"}


