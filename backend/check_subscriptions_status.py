#!/usr/bin/env python3
"""
Script para verificar periodicamente o status das assinaturas do Google Play
Deve ser executado como cron job (ex: a cada 6 horas)

Usage:
    python check_subscriptions_status.py
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv
from pathlib import Path
import asyncio

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mydatabase")

# Google Play credentials
GOOGLE_PLAY_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_PLAY_SERVICE_ACCOUNT_FILE", "google-play-service-account.json")
GOOGLE_PACKAGE_NAME = os.getenv("GOOGLE_PACKAGE_NAME", "com.meulookia.app")


async def check_all_subscriptions():
    """
    Verifica o status de todas as assinaturas ativas do Google Play
    """
    # Conectar ao MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        logging.info("🔍 Iniciando verificação de assinaturas...")
        
        # Verificar se arquivo de credenciais existe
        if not os.path.exists(GOOGLE_PLAY_SERVICE_ACCOUNT_FILE):
            logging.error(f"❌ Arquivo de credenciais não encontrado: {GOOGLE_PLAY_SERVICE_ACCOUNT_FILE}")
            logging.warning("⚠️ Configure GOOGLE_PLAY_SERVICE_ACCOUNT_FILE no .env")
            return
        
        # Autenticar com Google Play API
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_PLAY_SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/androidpublisher']
        )
        
        service = build('androidpublisher', 'v3', credentials=credentials)
        
        # Buscar todos usuários com assinatura ativa (não free)
        query = {
            "plano_ativo": {"$in": ["mensal", "semestral", "anual"]},
            "google_play_purchase_token": {"$ne": None}
        }
        
        users = await db.users.find(query).to_list(length=None)
        
        logging.info(f"📊 Encontrados {len(users)} usuários com assinatura ativa")
        
        updated_count = 0
        expired_count = 0
        error_count = 0
        
        for user in users:
            try:
                user_id = user['id']
                email = user['email']
                purchase_token = user.get('google_play_purchase_token')
                subscription_id = user.get('google_play_subscription_id', user.get('plano_ativo'))
                
                if not purchase_token or not subscription_id:
                    logging.warning(f"⚠️ User {email} missing purchase_token or subscription_id")
                    continue
                
                logging.info(f"🔍 Verificando {email} - {subscription_id}")
                
                # Consultar status no Google Play
                result = service.purchases().subscriptions().get(
                    packageName=GOOGLE_PACKAGE_NAME,
                    subscriptionId=subscription_id,
                    token=purchase_token
                ).execute()
                
                # Extrair informações
                expiry_millis = int(result.get('expiryTimeMillis', 0))
                expiration_date = datetime.fromtimestamp(expiry_millis / 1000.0)
                auto_renewing = result.get('autoRenewing', False)
                payment_state = result.get('paymentState', 0)
                
                now = datetime.utcnow()
                
                # Verificar se expirou
                if expiration_date < now:
                    logging.warning(f"⏰ Assinatura EXPIRADA: {email} - expirou em {expiration_date.strftime('%d/%m/%Y %H:%M')}")
                    
                    # Desativar plano
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {
                            "plano_ativo": "free",
                            "google_play_auto_renewing": False,
                            "google_play_expiry_time": expiration_date,
                        }}
                    )
                    expired_count += 1
                    
                else:
                    # Atualizar informações
                    update_data = {
                        "google_play_expiry_time": expiration_date,
                        "google_play_auto_renewing": auto_renewing,
                        "google_play_payment_state": payment_state,
                        "data_expiracao_plano": expiration_date,
                    }
                    
                    # Verificar se ainda está ativo
                    if payment_state in [1, 2]:  # Payment received or Free trial
                        update_data["plano_ativo"] = subscription_id
                        logging.info(f"✅ Assinatura ATIVA: {email} - expira em {expiration_date.strftime('%d/%m/%Y %H:%M')} - Auto-renew: {auto_renewing}")
                    else:
                        logging.warning(f"⚠️ Pagamento PENDENTE: {email} - payment_state={payment_state}")
                    
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": update_data}
                    )
                    updated_count += 1
                
            except Exception as e:
                logging.error(f"❌ Erro ao verificar {user.get('email', 'unknown')}: {str(e)}")
                error_count += 1
        
        logging.info(f"\n📊 RESUMO:")
        logging.info(f"  ✅ Atualizadas: {updated_count}")
        logging.info(f"  ⏰ Expiradas: {expired_count}")
        logging.info(f"  ❌ Erros: {error_count}")
        logging.info(f"  📊 Total verificadas: {len(users)}")
        
    except Exception as e:
        logging.error(f"❌ Erro no script: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
    
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(check_all_subscriptions())
