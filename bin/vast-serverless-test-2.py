import asyncio
import base64
from vastai import Serverless

MAX_TOKENS = 128

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

async def main():
    image_path = "/Users/a.alekhin/tmp/test.jpg"  # Замените на путь к вашему изображению
    base64_image = encode_image(image_path)

    async with Serverless() as client:
        endpoint = await client.get_endpoint(name="vatecovllm")

        payload = {
            "model": "thesby/Qwen3-VL-8B-NSFW-Caption-V4.5",  # или другая vision-модель
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": "https://i.postimg.cc/1th8KdK0/demo.jpg"}},
                        # {
                        #     "type": "image",
                        #     # "image": "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-VL/assets/demo.jpeg",
                        #     "image": f"data:image/jpeg;base64,{base64_image}"
                        # },
                        {"type": "text", "text": "describe the image"},
                    ],
                    # "role": "user",
                    # "content": [
                    #     {"type": "text", "text": "describe the image"},
                    #     {
                    #         "type": "image_url",
                    #         "image_url": {
                    #             "url": f"data:image/jpeg;base64,{base64_image}"
                    #         }
                    #     }
                    # ]
                }
            ],
            "max_tokens": MAX_TOKENS,
            "temperature": 0.7
        }

        # Используем /v1/chat/completions вместо /v1/completions
        response = await endpoint.request("/v1/chat/completions", payload, cost=MAX_TOKENS)
        print(response["response"]["choices"][0]["message"]["content"])

if __name__ == "__main__":
    asyncio.run(main())