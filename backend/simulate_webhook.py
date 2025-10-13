#!/usr/bin/env python3
"""
Script para simular um evento de webhook do Stripe manualmente
Útil para testar o processamento de webhooks sem precisar de pagamento real
"""
import os
import json
import requests
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Conectar ao MongoDB
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "test_database")

client = MongoClient(mongo_url)
db = client[db_name]

print("=" * 60)
print("🧪 Simulando Evento de Webhook do Stripe")
print("=" * 60)

# Buscar usuário Demo
user = db.users.find_one({"email": {"$regex": "demo", "$options": "i"}})

if not user:
    print("\n❌ Usuário 'Demo' não encontrado!")
    exit(1)

print(f"\n✅ Usuário encontrado:")
print(f"  - Email: {user['email']}")
print(f"  - Customer ID: {user.get('stripe_customer_id', 'N/A')}")
print(f"  - Plano atual: {user.get('plano_ativo', 'free')}")

customer_id = user.get('stripe_customer_id')

# Criar um payload de invoice.payment_succeeded simulado
webhook_payload = {
    "id": f"evt_test_{int(datetime.now().timestamp())}",
    "type": "invoice.payment_succeeded",
    "data": {
        "object": {
            "id": f"in_test_{int(datetime.now().timestamp())}",
            "object": "invoice",
            "customer": customer_id,
            "subscription": "sub_test_123456",
            "amount_paid": 100,  # R$1,00
            "amount_due": 100,
            "currency": "brl",
            "status": "paid",
            "billing_reason": "subscription_cycle",
            "period_start": int(datetime.now().timestamp()),
            "period_end": int((datetime.now()).timestamp()) + 2592000,  # 30 dias
        }
    }
}

print(f"\n📤 Enviando webhook simulado para o backend...")
print(f"  - Tipo: invoice.payment_succeeded")
print(f"  - Customer: {customer_id}")
print(f"  - Amount: R$1,00")

try:
    # Enviar para o endpoint de webhook localmente
    response = requests.post(
        'http://localhost:8001/api/stripe-webhook',
        json=webhook_payload,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    print(f"\n📥 Resposta do webhook:")
    print(f"  - Status Code: {response.status_code}")
    print(f"  - Response: {response.text}")
    
    if response.status_code == 200:
        print(f"\n✅ Webhook processado com sucesso!")
        
        # Verificar se o usuário foi atualizado
        updated_user = db.users.find_one({"email": user['email']})
        print(f"\n👤 Status do usuário após webhook:")
        print(f"  - Plano: {updated_user.get('plano_ativo', 'free')}")
        print(f"  - Expiração: {updated_user.get('data_expiracao_plano', 'N/A')}")
        
        print(f"\n🎉 Teste de webhook concluído!")
        print(f"   Verifique os logs: tail -f /var/log/supervisor/backend.err.log | grep WEBHOOK")
    else:
        print(f"\n⚠️ Webhook retornou erro: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Erro ao enviar webhook: {str(e)}")
    import traceback
    traceback.print_exc()
    
finally:
    client.close()

print("\n" + "=" * 60)
