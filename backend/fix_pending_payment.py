"""
Script para verificar e corrigir pagamentos pendentes
Execute: python fix_pending_payment.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime, timedelta
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

async def fix_pending_payments():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Searching for users with pending payments...")
    
    # Find users with pending plan info
    users_with_pending = await db.users.find({
        "stripe_pending_plan": {"$exists": True, "$ne": None}
    }).to_list(100)
    
    if not users_with_pending:
        print("✅ No pending payments found!")
        client.close()
        return
    
    print(f"📋 Found {len(users_with_pending)} user(s) with pending payments:\n")
    
    for user in users_with_pending:
        print(f"\n👤 User: {user['nome']} ({user['email']})")
        print(f"   Pending plan: {user.get('stripe_pending_plan')}")
        print(f"   Payment Intent ID: {user.get('stripe_payment_intent_id', 'N/A')}")
        
        payment_intent_id = user.get('stripe_payment_intent_id')
        plano_tipo = user.get('stripe_pending_plan')
        
        if payment_intent_id and plano_tipo:
            try:
                # Check payment intent status in Stripe
                payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                print(f"   💳 Stripe Payment Status: {payment_intent.status}")
                
                if payment_intent.status == "succeeded":
                    print(f"   ✅ Payment succeeded! Activating plan...")
                    
                    # Get plan details
                    plan = await db.plans.find_one({"id": plano_tipo})
                    if not plan:
                        print(f"   ❌ Plan {plano_tipo} not found in database")
                        continue
                    
                    # Calculate expiration date
                    if plan["interval"] == "month":
                        days_to_add = 30 * plan.get("interval_count", 1)
                    elif plan["interval"] == "year":
                        days_to_add = 365 * plan.get("interval_count", 1)
                    else:
                        days_to_add = 30
                    
                    expiration_date = datetime.utcnow() + timedelta(days=days_to_add)
                    
                    # Activate plan
                    await db.users.update_one(
                        {"id": user["id"]},
                        {"$set": {
                            "plano_ativo": plano_tipo,
                            "data_expiracao_plano": expiration_date,
                            "looks_usados": 0
                        }, "$unset": {
                            "stripe_pending_plan": "",
                            "stripe_pending_price_id": ""
                        }}
                    )
                    
                    print(f"   🎉 Plan activated successfully!")
                    print(f"   Plan: {plan['name']}")
                    print(f"   Expires: {expiration_date.strftime('%d/%m/%Y')}")
                else:
                    print(f"   ⏳ Payment status: {payment_intent.status} (not succeeded yet)")
                    
            except Exception as e:
                print(f"   ❌ Error checking payment: {str(e)}")
        else:
            print(f"   ⚠️  Missing payment_intent_id or plan type")
    
    # Close connection
    client.close()
    print("\n✅ Check completed!")

if __name__ == "__main__":
    asyncio.run(fix_pending_payments())
