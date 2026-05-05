import hashlib
import os

def hash_password(password: str) -> str:
    salt = os.environ.get("SALT", "scraper_secure_salt_123")
    salted = password + salt
    return hashlib.sha256(salted.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password
