import requests
from solana.rpc.api import Client

DEX_API = "https://api.dexscreener.com/latest/dex/pairs/solana"

class ExecutionEngine:
    def __init__(self, rpc_url="https://api.mainnet-beta.solana.com"):
        self.client = Client(rpc_url)

    def fetch_token_pair_data(self, token_address: str):
        response = requests.get(f"{DEX_API}/{token_address}")
        if response.status_code == 200:
            return response.json()
        raise Exception("Failed to fetch DEX data")

    def execute_swap_logic(self, pair_data: dict):
        price = pair_data.get("pair", {}).get("priceUsd", None)
        liquidity = pair_data.get("pair", {}).get("liquidity", {}).get("usd", None)
        if price and liquidity:
            if float(liquidity) > 10000 and float(price) > 0.01:
                return {"action": "approve", "reason": "Healthy metrics"}
            else:
                return {"action": "deny", "reason": "Low liquidity or price"}
        return {"action": "deny", "reason": "Incomplete data"}