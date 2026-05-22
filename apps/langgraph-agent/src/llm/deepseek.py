import os
from langchain_deepseek import ChatDeepSeek
from dotenv import load_dotenv

load_dotenv()

def get_llm(temperature: float = 0.7) -> ChatDeepSeek:
    return ChatDeepSeek(
        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        api_key=os.getenv("DEEPSEEK_API_KEY", ""),
        base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        temperature=temperature,
    )
