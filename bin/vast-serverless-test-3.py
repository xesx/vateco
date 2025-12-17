import asyncio
from vastai import Serverless
MAX_TOKENS = 200

async def main():
    # Initialize the client with your API key
    # The SDK will automatically use the VAST_API_KEY environment variable if set
    client = Serverless()  # Uses VAST_API_KEY environment variable
    # client = Serverless(api_key="c54f5ee6ab25da99feebbf79a08a1913105a9f6c39170bea2bfd7e69bcdeb24e")

    # Get your endpoint
    endpoint = await client.get_endpoint(name="vatecovllm")

    # Prepare your request payload
    payload = {
        "model": "thesby/Qwen3-VL-8B-NSFW-Caption-V4.5",
        "prompt": "create prompt for generation art on illustrious model",
        "max_tokens": MAX_TOKENS,
        "temperature": 0.7
    }

    # Make the request
    result = await endpoint.request("/v1/completions", payload, cost=MAX_TOKENS)

    # The SDK returns a wrapper object with metadata
    # Access the OpenAI-compatible response via result["response"]
    print(result)
    print("-----------------------")
    print(result["response"])
    print("-----------------------")
    print(result["response"]["choices"][0]["text"])

    # Clean up
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())