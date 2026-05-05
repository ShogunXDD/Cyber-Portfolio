import sqlite3
import os
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "storage.db")

def get_connection():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    try:
        c.execute('ALTER TABLE users ADD COLUMN last_ip TEXT')
        c.execute('ALTER TABLE users ADD COLUMN last_location TEXT')
        c.execute('ALTER TABLE users ADD COLUMN device_type TEXT')
    except sqlite3.OperationalError:
        pass

    c.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            query TEXT NOT NULL,
            scraped_sources TEXT,
            summary TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    try:
        c.execute('ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT "pending"')
        c.execute('ALTER TABLE feedback ADD COLUMN admin_reply TEXT')
    except sqlite3.OperationalError:
        pass

    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    import auth
    admin_password = os.environ.get("ADMIN_PASSWORD", "123")
    try:
        c.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                 ("admin", auth.hash_password(admin_password), "admin"))
    except sqlite3.IntegrityError:
        pass
        
    conn.commit()
    conn.close()

def create_user(username, password_hash):
    conn = get_connection()
    c = conn.cursor()
    role = 'user'
    try:
        c.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", (username, password_hash, role))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user_by_username(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    if user:
        return {"id": user[0], "username": user[1], "password_hash": user[2], "role": user[3]}
    return None

def get_user_by_id(user_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    if user:
        return {"id": user[0], "username": user[1], "role": user[2]}
    return None

def get_all_admins():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE role = 'admin'")
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0]} for r in rows]

def get_all_users():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, username, role, created_at, last_ip, last_location, device_type FROM users ORDER BY id ASC")
    users = [{"id": row[0], "username": row[1], "role": row[2], "created_at": row[3], "last_ip": row[4], "last_location": row[5], "device_type": row[6]} for row in c.fetchall()]
    conn.close()
    return users

def delete_user(user_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
    c.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

def save_search(user_id, query, scraped_sources, summary):
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO history (user_id, query, scraped_sources, summary) VALUES (?, ?, ?, ?)",
        (user_id, query, scraped_sources, summary)
    )
    conn.commit()
    conn.close()

def get_user_history(user_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, query, scraped_sources, summary, timestamp FROM history WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "query": r[1], "scraped_sources": r[2], "summary": r[3], "timestamp": r[4]} for r in rows]

def get_all_history():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT h.id, u.username, h.query, h.scraped_sources, h.summary, h.timestamp 
        FROM history h
        JOIN users u ON h.user_id = u.id
        ORDER BY h.timestamp DESC
    ''')
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "username": r[1], "query": r[2], "scraped_sources": r[3], "summary": r[4], "timestamp": r[5]} for r in rows]

def delete_search_history(history_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM history WHERE id = ?", (history_id,))
    conn.commit()
    conn.close()

def update_user_metadata(user_id, last_ip, last_location, device_type):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE users SET last_ip=?, last_location=?, device_type=? WHERE id=?", 
             (last_ip, last_location, device_type, user_id))
    conn.commit()
    conn.close()

def get_setting(key: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def set_setting(key: str, value: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, value))
    conn.commit()
    conn.close()

def submit_feedback(user_id, content):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO feedback (user_id, content) VALUES (?, ?)", (user_id, content))
    conn.commit()
    conn.close()

def get_all_feedback():
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            SELECT f.id, u.username, f.content, f.timestamp, f.user_id, f.status, f.admin_reply
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.timestamp DESC
        ''')
        rows = c.fetchall()
    except sqlite3.OperationalError:
        c.execute('''
            SELECT f.id, u.username, f.content, f.timestamp, f.user_id
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.timestamp DESC
        ''')
        rows = [(*r, "pending", None) for r in c.fetchall()]
    conn.close()
    return [{"id": r[0], "username": r[1], "content": r[2], "timestamp": r[3], "user_id": r[4], "status": r[5], "admin_reply": r[6]} for r in rows]

def get_user_feedback(user_id):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            SELECT id, content, timestamp, status, admin_reply
            FROM feedback
            WHERE user_id = ?
            ORDER BY timestamp DESC
        ''', (user_id,))
        rows = c.fetchall()
    except sqlite3.OperationalError:
        c.execute('''
            SELECT id, content, timestamp
            FROM feedback
            WHERE user_id = ?
            ORDER BY timestamp DESC
        ''', (user_id,))
        rows = [(*r, "pending", None) for r in c.fetchall()]
    conn.close()
    return [{"id": r[0], "content": r[1], "timestamp": r[2], "status": r[3], "admin_reply": r[4]} for r in rows]

def mark_feedback_replied(feedback_id, reply):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("UPDATE feedback SET status='replied', admin_reply=? WHERE id=?", (reply, feedback_id))
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()

def delete_feedback(feedback_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
    conn.commit()
    conn.close()

def create_notification(user_id, message):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO notifications (user_id, message) VALUES (?, ?)", (user_id, message))
    conn.commit()
    conn.close()

def get_notifications(user_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, message, is_read, timestamp FROM notifications WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "message": r[1], "is_read": bool(r[2]), "timestamp": r[3]} for r in rows]

def mark_notification_read(notification_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()

init_db()
