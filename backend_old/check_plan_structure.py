#!/usr/bin/env python3
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json

load_dotenv()

mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "test_database")

client = MongoClient(mongo_url)
db = client[db_name]

plano = db.plans.find_one({"name": "Plano Mensal"})
if plano:
    print("Estrutura do Plano Mensal:")
    for key, value in plano.items():
        print(f"  {key}: {value}")

client.close()
