
import requests

def fetch_recent_token_activity(mint_address):
    url = f"https://api.dexscreener.io/latest/dex/tokens/{mint_address}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return {
            "price": data.get("priceUsd"),
            "volume24h": data.get("volume", {}).get("h24"),
            "txCount": data.get("txCount", 0)
        }
    return {"error": "Failed to fetch token activity"}

