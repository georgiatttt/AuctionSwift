from fastapi import FastAPI
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

app = FastAPI()  # 👈 this line defines the app that Uvicorn needs

@app.get("/")
def root():
    return {"message": "all good"}
