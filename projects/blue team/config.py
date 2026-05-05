import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    @property
    def OPENAI_API_KEY(self):
        return os.getenv("OPENAI_API_KEY")
    
    @property
    def GOOGLE_API_KEY(self):
        return os.getenv("GOOGLE_API_KEY")
        
    @property
    def ANTHROPIC_API_KEY(self):
        return os.getenv("ANTHROPIC_API_KEY")

    @property
    def GROQ_API_KEY(self):
        return os.getenv("GROQ_API_KEY")
        
    @property
    def OLLAMA_BASE_URL(self):
        return os.getenv("OLLAMA_BASE_URL")
        
    @property
    def OPENROUTER_BASE_URL(self):
        return os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        
    @property
    def OPENROUTER_API_KEY(self):
        return os.getenv("OPENROUTER_API_KEY")
        
    @property
    def LLAMA_CPP_BASE_URL(self):
        return os.getenv("LLAMA_CPP_BASE_URL")
    @property
    def TOGETHER_API_KEY(self):
        return os.getenv("TOGETHER_API_KEY")

    @property
    def MISTRAL_API_KEY(self):
        return os.getenv("MISTRAL_API_KEY")

    @property
    def DEEPSEEK_API_KEY(self):
        return os.getenv("DEEPSEEK_API_KEY")

    @property
    def HUGGINGFACE_API_KEY(self):
        return os.getenv("HUGGINGFACE_API_KEY")

conf = Config()