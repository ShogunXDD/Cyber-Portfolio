import os
import requests
from dotenv import load_dotenv

load_dotenv("/app/.env")

key = os.environ.get("GOOGLE_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

response = requests.get(url)

if response.status_code == 200:
    models = response.json().get('models', [])
    print(f"Total models available: {len(models)}")
    for m in models:
        if 'generateContent' in m.get('supportedGenerationMethods', []):
            print(f"Available for generation: {m.get('name')}")
else:
    print(f"Failed to list models: {response.status_code} - {response.text}")
