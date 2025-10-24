#!/usr/bin/env python3
"""
Script para criar uma subscription de teste no Stripe e forçar cobrança recorrente
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import stripe
from datetime import datetime, timedelta

load_dotenv()

# Configurar Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

# Conectar ao MongoDB
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "test_database")

client = MongoClient(mongo_url)
db = client[db_name]

print("=" * 60)
print("🔄 Criando Subscription de Teste + Forçando Cobrança")
print("=" * 60)

# Buscar usuário Demo
user = db.users.find_one({"email": {"$regex": "demo", "$options": "i"}})

if not user:
    print("\n❌ Usuário 'Demo' não encontrado!")
    exit(1)

print(f"\n✅ Usuário encontrado:")
print(f"  - Email: {user['email']}")
print(f"  - Customer ID: {user.get('stripe_customer_id', 'N/A')}")

customer_id = user.get('stripe_customer_id')

if not customer_id:
    print("\n❌ Usuário não tem customer_id no Stripe!")
    exit(1)

try:
    # Buscar ou criar o preço de R$1,00
    print(f"\n🔍 Buscando price_id do plano mensal...")
    
    # Buscar o plano mensal no banco
    plan = db.plans.find_one({"id": "mensal"})
    if not plan:
        print("❌ Plano mensal não encontrado no banco!")
        exit(1)
    
    print(f"  - Plano: {plan['name']}")
    print(f"  - Preço: R${plan['price'] / 100:.2f}")
    
    # Buscar prices no Stripe com valor de 100 centavos (R$1,00)
    prices = stripe.Price.list(
        active=True,
        currency='brl',
        type='recurring',
        limit=100
    )
    
    price_id = None
    for price in prices.data:
        if price['unit_amount'] == 100 and price['recurring']['interval'] == 'month':
            price_id = price['id']
            break
    
    # Se não encontrou, criar um novo
    if not price_id:
        print(f"\n📦 Criando novo price no Stripe (R$1,00/mês)...")
        
        # Criar produto primeiro
        product = stripe.Product.create(
            name="Plano Mensal - Teste Recorrência",
            description="Plano mensal de teste para webhooks"
        )
        
        price = stripe.Price.create(
            product=product['id'],
            unit_amount=100,
            currency='brl',
            recurring={'interval': 'month'},
        )
        price_id = price['id']
        print(f"  - Price criado: {price_id}")
    else:
        print(f"  - Price encontrado: {price_id}")
    
    # Criar subscription
    print(f"\n💳 Criando subscription no Stripe...")
    
    subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{'price': price_id}],
        payment_behavior='default_incomplete',
        payment_settings={'save_default_payment_method': 'on_subscription'},
        expand=['latest_invoice.payment_intent'],
    )
    
    print(f"  - Subscription criada: {subscription['id']}")
    print(f"  - Status: {subscription['status']}")
    
    # Atualizar usuário no banco
    db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "stripe_subscription_id": subscription['id'],
                "plano_ativo": "mensal",
                "data_expiracao_plano": datetime.utcnow() + timedelta(days=30)
            }
        }
    )
    print(f"  - Banco de dados atualizado")
    
    # Se a subscription precisa de pagamento, tentar cobrar
    if subscription['status'] == 'incomplete':
        latest_invoice = subscription['latest_invoice']
        if latest_invoice and isinstance(latest_invoice, dict):
            invoice_id = latest_invoice['id']
            print(f"\n💰 Tentando pagar invoice: {invoice_id}")
            
            try:
                paid_invoice = stripe.Invoice.pay(invoice_id)
                print(f"  - Invoice paga: {paid_invoice['status']}")
            except stripe.error.CardError as e:
                print(f"  - ⚠️ Erro no cartão: {e.user_message}")
    
    # Agora forçar uma nova cobrança para testar webhook
    print(f"\n⚡ Forçando nova cobrança para testar webhook...")
    
    invoice = stripe.Invoice.create(
        customer=customer_id,
        subscription=subscription['id'],
        auto_advance=True,
    )
    
    print(f"  - Invoice criada: {invoice['id']}")
    
    if invoice['status'] == 'draft':
        invoice = stripe.Invoice.finalize_invoice(invoice['id'])
    
    if invoice['status'] == 'open':
        try:
            paid_invoice = stripe.Invoice.pay(invoice['id'])
            print(f"\n✅ Cobrança recorrente forçada com sucesso!")
            print(f"  - Amount: R${paid_invoice['amount_paid'] / 100:.2f}")
            print(f"\n🎉 Webhook deve ser enviado agora!")
            print(f"   Verifique: tail -f /var/log/supervisor/backend.err.log | grep WEBHOOK")
        except Exception as e:
            print(f"  - ⚠️ Erro ao pagar: {str(e)}")
    
except Exception as e:
    print(f"\n❌ Erro: {str(e)}")
    import traceback
    traceback.print_exc()
    
finally:
    client.close()

print("\n" + "=" * 60)
