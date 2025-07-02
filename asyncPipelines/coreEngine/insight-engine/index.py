from executionEngine import ExecutionEngine
from signingEngine import SigningEngine

def main():
    token = ""  
    executor = ExecutionEngine()
    signer = SigningEngine()

    try:
        data = executor.fetch_token_pair_data(token)
        decision = executor.execute_swap_logic(data)
        if decision["action"] == "approve":
            result = signer.sign_transaction(token)
            print(f"Transaction signed: {result}")
        else:
            print(f"Transaction blocked: {decision['reason']}")
    except Exception as e:
        print(f"Engine error: {e}")

if __name__ == "__main__":
    main()