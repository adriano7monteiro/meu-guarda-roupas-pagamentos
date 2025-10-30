#!/usr/bin/env python3
"""
Script para remover assinatura do usuário Demo e resetar para plano gratuito
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import stripe

load_dotenv()

# Configurar Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

# Conectar ao MongoDB
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "test_database")

client = MongoClient(mongo_url)
db = client[db_name]

print("=" * 60)
print("🧹 Removendo Assinatura do Usuário Demo")
print("=" * 60)

# Buscar usuário Demo
user = db.users.find_one({"email": {"$regex": "demo", "$options": "i"}})

if not user:
    print("\n❌ Usuário 'Demo' não encontrado!")
    client.close()
    exit(1)

print(f"\n👤 Usuário encontrado:")
print(f"  - Email: {user['email']}")
print(f"  - Nome: {user.get('nome', 'N/A')}")
print(f"  - Plano atual: {user.get('plano_ativo', 'free')}")
print(f"  - Customer ID: {user.get('stripe_customer_id', 'N/A')}")
print(f"  - Subscription ID: {user.get('stripe_subscription_id', 'N/A')}")

# Cancelar subscription no Stripe se existir
subscription_id = user.get('stripe_subscription_id')
if subscription_id:
    try:
        print(f"\n🗑️  Cancelando subscription no Stripe: {subscription_id}")
        subscription = stripe.Subscription.delete(subscription_id)
        print(f"  ✅ Subscription cancelada: {subscription.status}")
    except Exception as e:
        print(f"  ⚠️  Erro ao cancelar subscription: {str(e)}")
        print(f"     (Pode já estar cancelada)")

# Resetar usuário no MongoDB
print(f"\n🔄 Resetando usuário no banco de dados...")
result = db.users.update_one(
    {"id": user["id"]},
    {
        "$set": {
            "plano_ativo": "free",
            "looks_usados": 0,
            "data_expiracao_plano": None,
        },
        "$unset": {
            "stripe_subscription_id": "",
            "stripe_payment_intent_id": "",
            "stripe_pending_plan": "",
            "stripe_pending_price_id": ""
        }
    }
)

if result.modified_count > 0:
    print(f"  ✅ Usuário resetado com sucesso!")
    
    # Verificar atualização
    updated_user = db.users.find_one({"id": user["id"]})
    print(f"\n📊 Status após reset:")
    print(f"  - Plano: {updated_user.get('plano_ativo', 'free')}")
    print(f"  - Looks usados: {updated_user.get('looks_usados', 0)}")
    print(f"  - Subscription ID: {updated_user.get('stripe_subscription_id', 'Nenhum')}")
    print(f"\n🎉 Usuário Demo pronto para novo teste!")
else:
    print(f"  ⚠️  Nenhuma alteração foi necessária")

client.close()
print("\n" + "=" * 60)
