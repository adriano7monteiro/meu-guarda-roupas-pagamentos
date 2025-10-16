"""
Script de EMERGÊNCIA para ativar plano premium manualmente
quando o pagamento foi processado mas não ativado no sistema

Execute: python emergency_activate_plan.py <email> <plano>
Exemplo: python emergency_activate_plan.py user@email.com mensal
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def activate_plan(email: str, plano_tipo: str):
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print(f"🔍 Procurando usuário com e-mail: {email}")
    
    # Find user
    user = await db.users.find_one({"email": email})
    
    if not user:
        print(f"❌ Usuário com e-mail {email} não encontrado!")
        client.close()
        return
    
    print(f"✅ Usuário encontrado: {user['nome']}")
    print(f"   Plano atual: {user.get('plano_ativo', 'free')}")
    
    # Get plan details
    plan = await db.plans.find_one({"id": plano_tipo})
    
    if not plan:
        print(f"❌ Plano '{plano_tipo}' não encontrado!")
        print(f"   Planos disponíveis: mensal, semestral, anual")
        client.close()
        return
    
    print(f"\n📋 Plano selecionado: {plan['name']} - R$ {plan['price'] / 100:.2f}")
    
    # Calculate expiration date
    if plan["interval"] == "month":
        days_to_add = 30 * plan.get("interval_count", 1)
    elif plan["interval"] == "year":
        days_to_add = 365 * plan.get("interval_count", 1)
    else:
        days_to_add = 30
    
    expiration_date = datetime.utcnow() + timedelta(days=days_to_add)
    
    # Activate plan
    result = await db.users.update_one(
        {"email": email},
        {"$set": {
            "plano_ativo": plano_tipo,
            "data_expiracao_plano": expiration_date,
            "looks_usados": 0,
            "emergency_activation": True,
            "emergency_activation_date": datetime.utcnow()
        }, "$unset": {
            "stripe_pending_plan": "",
            "stripe_pending_price_id": ""
        }}
    )
    
    if result.modified_count > 0:
        print(f"\n✅ PLANO ATIVADO COM SUCESSO!")
        print(f"   Plano: {plan['name']}")
        print(f"   Expira em: {expiration_date.strftime('%d/%m/%Y')}")
        print(f"   Looks ilimitados ativados!")
        print(f"\n🎉 O usuário já pode usar o app com plano premium!")
    else:
        print(f"❌ Erro ao atualizar o usuário")
    
    client.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("❌ Uso: python emergency_activate_plan.py <email> <plano>")
        print("   Planos disponíveis: mensal, semestral, anual")
        print("\nExemplo:")
        print("   python emergency_activate_plan.py user@email.com mensal")
        sys.exit(1)
    
    email = sys.argv[1]
    plano = sys.argv[2]
    
    if plano not in ['mensal', 'semestral', 'anual']:
        print(f"❌ Plano inválido: {plano}")
        print("   Planos disponíveis: mensal, semestral, anual")
        sys.exit(1)
    
    print("="*60)
    print("🚨 ATIVAÇÃO MANUAL DE EMERGÊNCIA")
    print("="*60)
    
    asyncio.run(activate_plan(email, plano))
