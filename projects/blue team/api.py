import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(override=True)

import requests
import database
import auth
from health import check_llm_health, check_search_engines, check_tor_proxy
from llm_utils import get_model_choices
from scrape import scrape_multiple
from search import get_search_results
from llm import get_llm, refine_query, filter_results, generate_summary, PRESET_PROMPTS
from langchain_core.callbacks.base import BaseCallbackHandler

app = FastAPI(title="Scraper API")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins == "*":
    cors_origins = ["*"]
else:
    cors_origins = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WSCallbackHandler(BaseCallbackHandler):
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.loop = asyncio.get_running_loop()

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        asyncio.run_coroutine_threadsafe(
            self.websocket.send_json({"type": "chunk", "content": token}), 
            self.loop
        )

@app.post("/api/auth/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...), is_admin: str = Form("false")):
    user = database.get_user_by_username(username)
    target_role = "admin" if is_admin.lower() == "true" else "user"
    
    if user and user["role"] == target_role and auth.verify_password(password, user["password_hash"]):
        ip = request.client.host
        ua = request.headers.get("user-agent", "")
        device_type = "Desktop"
        if "Mobi" in ua or "Android" in ua or "iPhone" in ua:
            device_type = "Mobile"
        elif "Tablet" in ua or "iPad" in ua:
            device_type = "Tablet"
            
        location = "Unknown"
        if ip in ("127.0.0.1", "::1", "localhost", "host.docker.internal", "172.17.0.1") or ip.startswith("172."):
            location = "[ INTERNAL SECURE NETWORK ]"
        else:
            try:
                ip_info = await asyncio.to_thread(requests.get, f"http://ip-api.com/json/{ip}", timeout=2)
                if ip_info.status_code == 200:
                    data = ip_info.json()
                    if data.get("status") == "success":
                        location = f"{data.get('city', 'Unknown')}, {data.get('country', 'Unknown')}"
            except Exception:
                pass
                
        database.update_user_metadata(user["id"], ip, location, device_type)
        return {"id": user["id"], "username": user["username"], "role": user["role"]}
    raise HTTPException(status_code=401, detail="Invalid credentials or role.")

@app.post("/api/auth/register")
async def register(username: str = Form(...), password: str = Form(...)):
    if database.create_user(username, auth.hash_password(password)):
        return {"success": True, "message": "User created successfully"}
    raise HTTPException(status_code=400, detail="Username already exists")

@app.get("/api/admin/users")
async def get_users():
    return database.get_all_users()

@app.post("/api/admin/users")
async def add_user(username: str = Form(...), password: str = Form(...)):
    if database.create_user(username, auth.hash_password(password)):
        return {"success": True}
    raise HTTPException(status_code=400, detail="Username already exists")

@app.delete("/api/admin/users/{user_id}")
async def remove_user(user_id: int):
    database.delete_user(user_id)
    return {"success": True}

@app.get("/api/admin/history")
async def get_history():
    return database.get_all_history()

@app.get("/api/history/{user_id}")
async def fetch_user_history(user_id: int):
    return database.get_user_history(user_id)

@app.delete("/api/admin/history/{history_id}")
async def remove_history(history_id: int):
    database.delete_search_history(history_id)
    return {"success": True}

@app.get("/api/models")
async def get_models():
    all_models = get_model_choices()
    allowed_str = database.get_setting("allowed_models")
    if allowed_str is not None:
        try:
            whitelist = json.loads(allowed_str)
            return [m for m in all_models if m in whitelist]
        except Exception:
            pass
    return all_models

@app.get("/api/admin/models")
async def get_admin_models():
    all_models = get_model_choices()
    allowed_str = database.get_setting("allowed_models")
    enabled = all_models
    if allowed_str is not None:
         try:
             enabled = json.loads(allowed_str)
         except Exception:
             pass
    return {"all_available": all_models, "enabled": enabled}

@app.post("/api/admin/models")
async def set_admin_models(models_json: str = Form(...)):
    try:
        models = json.loads(models_json)
        if not isinstance(models, list):
             raise ValueError("Must be a list")
        database.set_setting("allowed_models", json.dumps(models))
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/feedback")
async def post_feedback(user_id: int = Form(...), content: str = Form(...)):
    database.submit_feedback(user_id, content)
    
    admins = database.get_all_admins()
    user_info = database.get_user_by_id(user_id)
    username = user_info['username'] if user_info else 'Unknown Operative'
    for admin in admins:
        database.create_notification(admin['id'], f"New Field Report from {username}")
        
    return {"success": True}

@app.get("/api/admin/feedback")
async def get_admin_feedback():
    return database.get_all_feedback()

@app.delete("/api/admin/feedback/{feedback_id}")
async def delete_admin_feedback(feedback_id: int):
    database.delete_feedback(feedback_id)
    return {"success": True}

@app.post("/api/admin/feedback/{feedback_id}/reply")
async def reply_feedback(feedback_id: int, user_id: int = Form(...), message: str = Form(...)):
    database.create_notification(user_id, f"Admin Mission Command: {message}")
    database.mark_feedback_replied(feedback_id, message)
    return {"success": True}

@app.get("/api/feedback/{user_id}")
async def get_user_feedback(user_id: int):
    return database.get_user_feedback(user_id)

@app.get("/api/notifications/{user_id}")
async def api_get_notifications(user_id: int):
    return database.get_notifications(user_id)

@app.put("/api/notifications/{notification_id}/read")
async def api_read_notification(notification_id: int):
    database.mark_notification_read(notification_id)
    return {"success": True}

@app.websocket("/api/scrape/ws")
async def scrape_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        payload = json.loads(data)
        query = payload.get("query")
        model = payload.get("model")
        threads = payload.get("threads", 4)
        preset = payload.get("preset", "threat_intel")
        user_id = payload.get("user_id")

        await websocket.send_json({"type": "stage", "content": f"Loading LLM {model}..."})
        llm = get_llm(model)
        
        await websocket.send_json({"type": "stage", "content": "Refining query..."})
        refined = await asyncio.to_thread(refine_query, llm, query)
        await websocket.send_json({"type": "stage", "content": f"Refined to: {refined}"})
        
        await websocket.send_json({"type": "stage", "content": "Searching dark web (Tor)..."})
        results = await asyncio.to_thread(get_search_results, refined.replace(" ", "+"), max_workers=threads)
        await websocket.send_json({"type": "stage", "content": f"Found {len(results)} results."})

        await websocket.send_json({"type": "stage", "content": "Filtering results..."})
        filtered = await asyncio.to_thread(filter_results, llm, refined, results)
        await websocket.send_json({"type": "stage", "content": f"Retained {len(filtered)} results."})

        await websocket.send_json({"type": "stage", "content": "Scraping content..."})
        scraped = await asyncio.to_thread(scrape_multiple, filtered, max_workers=threads)

        await websocket.send_json({"type": "stage", "content": "Generating summary stream..."})
        
        ws_handler = WSCallbackHandler(websocket)
        llm.callbacks = [ws_handler]
        
        summary_result = await asyncio.to_thread(generate_summary, llm, query, scraped, preset=preset, custom_instructions="")

        if "Failed to generate summary" in summary_result:
            await websocket.send_json({"type": "chunk", "content": "\n\n**[!] Error:** LLM generation failed or was aborted. Please check your backend logs for API key or credit issues (e.g. OpenRouter out of credits).\n"})

        sources_text = "\n\n### 🔗 Scraped Sources:\n"
        for url in list(scraped.keys()):
            sources_text += f"- {url}\n"

        await websocket.send_json({"type": "chunk", "content": sources_text})
        
        if user_id:
            await asyncio.to_thread(database.save_search, user_id, query, str(list(scraped.keys())), summary_result + sources_text)

        await websocket.send_json({"type": "stage", "content": "Task Completed Successfully!"})
        await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"type": "error", "content": str(e)})

frontend_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")
