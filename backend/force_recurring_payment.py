#!/usr/bin/env python3
"""
Script para forçar uma cobrança recorrente imediata no Stripe
Útil para testar webhooks sem esperar a renovação automática
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
print("🔄 Forçando Cobrança Recorrente - Teste de Webhook")
print("=" * 60)

# Buscar usuário Demo ou o último usuário com assinatura ativa
user = db.users.find_one({"email": {"$regex": "demo", "$options": "i"}})

if not user:
    print("\n⚠️ Usuário 'Demo' não encontrado. Buscando qualquer usuário com assinatura...")
    user = db.users.find_one({
        "plano_ativo": {"$ne": "free"},
        "stripe_subscription_id": {"$exists": True, "$ne": None}
    })

if not user:
    print("\n❌ Nenhum usuário com assinatura ativa encontrado!")
    print("\nUsuários disponíveis:")
    for u in db.users.find().limit(5):
        print(f"  - {u['email']} (plano: {u.get('plano_ativo', 'free')})")
    exit(1)

print(f"\n✅ Usuário encontrado:")
print(f"  - Email: {user['email']}")
print(f"  - Nome: {user.get('nome', 'N/A')}")
print(f"  - Plano: {user.get('plano_ativo', 'free')}")
print(f"  - Customer ID: {user.get('stripe_customer_id', 'N/A')}")
print(f"  - Subscription ID: {user.get('stripe_subscription_id', 'N/A')}")

stripe_subscription_id = user.get('stripe_subscription_id')

if not stripe_subscription_id:
    print("\n❌ Usuário não possui subscription_id no Stripe!")
    print("   O usuário precisa ter uma assinatura ativa para testar a recorrência.")
    exit(1)

try:
    # Buscar a subscription no Stripe
    print(f"\n🔍 Buscando subscription no Stripe: {stripe_subscription_id}")
    subscription = stripe.Subscription.retrieve(stripe_subscription_id)
    
    print(f"  - Status: {subscription['status']}")
    print(f"  - Customer: {subscription['customer']}")
    print(f"  - Current period end: {subscription['current_period_end']}")
    
    # Criar uma invoice imediata (forçar cobrança)
    print(f"\n💳 Criando invoice imediata para testar cobrança recorrente...")
    
    invoice = stripe.Invoice.create(
        customer=subscription['customer'],
        subscription=stripe_subscription_id,
        auto_advance=True,  # Finalizar e cobrar automaticamente
    )
    
    print(f"  - Invoice criada: {invoice['id']}")
    print(f"  - Status: {invoice['status']}")
    print(f"  - Amount: R${invoice['amount_due'] / 100:.2f}")
    
    # Finalizar e cobrar a invoice
    if invoice['status'] == 'draft':
        print(f"\n⚡ Finalizando invoice para cobrar...")
        invoice = stripe.Invoice.finalize_invoice(invoice['id'])
        print(f"  - Invoice finalizada: {invoice['status']}")
    
    # Tentar pagar a invoice
    if invoice['status'] == 'open':
        print(f"\n💰 Cobrando invoice no cartão do cliente...")
        paid_invoice = stripe.Invoice.pay(invoice['id'])
        
        print(f"\n✅ Invoice paga com sucesso!")
        print(f"  - Status: {paid_invoice['status']}")
        print(f"  - Amount paid: R${paid_invoice['amount_paid'] / 100:.2f}")
        print(f"\n🎉 Cobrança recorrente forçada com sucesso!")
        print(f"   O Stripe deve enviar o webhook 'invoice.payment_succeeded' agora.")
        print(f"   Verifique os logs do backend para ver se foi recebido:")
        print(f"   tail -f /var/log/supervisor/backend.err.log | grep WEBHOOK")
    else:
        print(f"\n⚠️ Invoice status: {invoice['status']}")
        print(f"   Não foi possível cobrar automaticamente.")
        
except stripe.error.InvalidRequestError as e:
    print(f"\n❌ Erro do Stripe: {str(e)}")
    print(f"   Isso pode acontecer se:")
    print(f"   - A subscription já foi cancelada")
    print(f"   - O customer não tem método de pagamento válido")
    print(f"   - A subscription não está ativa")
    
except Exception as e:
    print(f"\n❌ Erro inesperado: {str(e)}")
    
finally:
    client.close()

print("\n" + "=" * 60)
