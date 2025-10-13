"""
Script para testar o card premium - ativa plano premium para o usuário demo
Execute: python test_premium_card.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def activate_premium_for_demo():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Find demo user
    demo_user = await db.users.find_one({"email": "demo@teste.com"})
    
    if not demo_user:
        print("❌ Demo user not found. Please login first to create the user.")
        client.close()
        return
    
    print(f"✅ Found demo user: {demo_user['nome']} ({demo_user['email']})")
    print(f"   Current plan: {demo_user.get('plano_ativo', 'free')}")
    print(f"   Looks used: {demo_user.get('looks_usados', 0)}")
    
    # Activate annual premium plan
    expiration_date = datetime.utcnow() + timedelta(days=365)
    
    result = await db.users.update_one(
        {"email": "demo@teste.com"},
        {"$set": {
            "plano_ativo": "anual",
            "data_expiracao_plano": expiration_date,
            "stripe_customer_id": "cus_test_demo_user",
            "stripe_subscription_id": "sub_test_demo_premium"
        }}
    )
    
    if result.modified_count > 0:
        print(f"\n✅ Premium plan activated successfully!")
        print(f"   Plan: Plano Anual")
        print(f"   Expires: {expiration_date.strftime('%d/%m/%Y')}")
        print(f"\n🎉 Reload the app to see the premium card!")
    else:
        print("❌ Failed to update user")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(activate_premium_for_demo())
