import asyncio
from vastai import Serverless
MAX_TOKENS = 100

async def main():
    # Initialize the client with your API key
    # The SDK will automatically use the VAST_API_KEY environment variable if set
    client = Serverless()  # Uses VAST_API_KEY environment variable
    client = Serverless(api_key="c54f5ee6ab25da99feebbf79a08a1913105a9f6c39170bea2bfd7e69bcdeb24e")

    # Get your endpoint
    endpoint = await client.get_endpoint(name="lyqdvi6q")

    # Prepare your request payload
    payload = {
        "model": "Qwen/Qwen3-8B",
        "prompt": "Explain quantum computing in simple terms",
        "max_tokens": MAX_TOKENS,
        "temperature": 0.7
    }

    # Make the request
    result = await endpoint.request("/v1/completions", payload, cost=MAX_TOKENS)

    # The SDK returns a wrapper object with metadata
    # Access the OpenAI-compatible response via result["response"]
    print(result["response"]["choices"][0]["text"])

    # Clean up
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())