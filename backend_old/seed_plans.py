"""
Script para popular o banco de dados com os planos de assinatura
Execute: python seed_plans.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_plans():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Clear existing plans
    await db.plans.delete_many({})
    print("Cleared existing plans")
    
    # Define plans
    plans = [
        {
            "id": "mensal",
            "name": "Plano Mensal",
            "price": 1990,  # R$ 19,90 em centavos
            "interval": "month",
            "interval_count": 1,
            "features": [
                "Looks ilimitados",
                "Virtual try-on ilimitado",
                "Sugestões de IA personalizadas",
                "Salvar looks favoritos"
            ],
            "badge": "MENSAL",
            "color": "#6c5ce7",
            "active": True
        },
        {
            "id": "semestral",
            "name": "Plano Semestral",
            "price": 9900,  # R$ 99,00 em centavos
            "interval": "month",
            "interval_count": 6,
            "features": [
                "Looks ilimitados",
                "Virtual try-on ilimitado",
                "Sugestões de IA personalizadas",
                "Salvar looks favoritos",
                "Desconto de 17%"
            ],
            "badge": "SEMESTRAL",
            "color": "#00b894",
            "active": True
        },
        {
            "id": "anual",
            "name": "Plano Anual",
            "price": 17990,  # R$ 179,90 em centavos
            "interval": "year",
            "interval_count": 1,
            "features": [
                "Looks ilimitados",
                "Virtual try-on ilimitado",
                "Sugestões de IA personalizadas",
                "Salvar looks favoritos",
                "Desconto de 25%",
                "Acesso prioritário a novos recursos"
            ],
            "badge": "ANUAL ⭐",
            "color": "#FFD700",
            "active": True
        }
    ]
    
    # Insert plans
    result = await db.plans.insert_many(plans)
    print(f"Inserted {len(result.inserted_ids)} plans:")
    
    for plan in plans:
        print(f"  - {plan['name']}: R$ {plan['price'] / 100:.2f} ({plan['badge']})")
    
    # Close connection
    client.close()
    print("\nSeed completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_plans())
