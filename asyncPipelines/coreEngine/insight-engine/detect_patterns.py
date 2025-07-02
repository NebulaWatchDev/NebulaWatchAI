
import requests

def detect_token_trends(mint_address):
    url = f"https://api.dexscreener.io/latest/dex/tokens/{mint_address}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        volume_change = data.get("volumeChange", {}).get("h24", 0)
        price_change = data.get("priceChange", {}).get("h24", 0)
        trend = "rising" if price_change > 0 else "falling" if price_change < 0 else "stable"
        return {
            "price_change_24h": price_change,
            "volume_change_24h": volume_change,
            "trend": trend
        }
    return {"error": "Unable to analyze trend"}

