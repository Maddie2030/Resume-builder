# Template-service/app/db/mongodb.py

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "user_profiles_db")

db_client: AsyncIOMotorClient = None
database = None

async def connect_to_mongo():
    global db_client, database
    try:
        db_client = AsyncIOMotorClient(MONGO_URI)
        database = db_client[MONGO_DB_NAME]
        await database.command("ping")
        print("Template Service: Connected to MongoDB successfully.")
    except Exception as e:
        print(f"Template Service: Failed to connect to MongoDB. Error: {e}")
        raise

async def close_mongo_connection():
    global db_client
    if db_client:
        db_client.close()
        print("Template Service: MongoDB connection closed.")

def get_database():
    global database
    return database
