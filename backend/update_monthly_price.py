#!/usr/bin/env python3
"""
Script para atualizar o preço do plano mensal para R$1,00
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Conectar ao MongoDB
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "test_database")

client = MongoClient(mongo_url)
db = client[db_name]

# Buscar o plano mensal atual
plano_mensal = db.plans.find_one({"name": "Plano Mensal"})

if plano_mensal:
    print(f"Plano Mensal encontrado:")
    print(f"  - ID: {plano_mensal['_id']}")
    print(f"  - Nome: {plano_mensal['name']}")
    print(f"  - Preço atual: R${plano_mensal['price']:.2f}")
    print(f"  - Intervalo: {plano_mensal['interval']}")
    
    # Atualizar o preço para R$1,00
    result = db.plans.update_one(
        {"name": "Plano Mensal"},
        {"$set": {"price": 1.00}}
    )
    
    if result.modified_count > 0:
        print("\n✅ Preço atualizado com sucesso!")
        
        # Verificar atualização
        plano_atualizado = db.plans.find_one({"name": "Plano Mensal"})
        print(f"  - Novo preço: R${plano_atualizado['price']:.2f}")
    else:
        print("\n⚠️ Nenhuma alteração foi feita (o preço já era R$1,00?)")
else:
    print("❌ Plano Mensal não encontrado no banco de dados!")
    print("\nPlanos disponíveis:")
    for plano in db.plans.find():
        print(f"  - {plano['name']}: R${plano['price']:.2f}")

client.close()
