#!/usr/bin/env python3
import os
import json
import firebase_admin
from firebase_admin import credentials, project_management
import pathlib

# Inicializar Firebase
firebase_file = pathlib.Path(__file__).parent / 'firebase-service-account.json'
cred = credentials.Certificate(str(firebase_file))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
    print("✅ Firebase inicializado\n")

print("🔍 Verificando apps cadastrados no Firebase:\n")

try:
    # Listar apps iOS
    ios_apps = project_management.list_ios_apps()
    
    if ios_apps:
        print(f"📱 Apps iOS encontrados: {len(ios_apps)}")
        for app in ios_apps:
            metadata = project_management.get_ios_app_metadata(app.app_id)
            print(f"\n   App ID: {app.app_id}")
            print(f"   Display Name: {metadata.display_name}")
            print(f"   Bundle ID: {metadata.bundle_id}")
    else:
        print("❌ NENHUM APP iOS CADASTRADO!")
        print("   Este é o problema! Você precisa adicionar o app iOS no Firebase.")
        print("\n📋 Como adicionar:")
        print("   1. Firebase Console → Project Settings")
        print("   2. Scroll até 'Your apps'")
        print("   3. Clique no ícone iOS (Apple)")
        print("   4. Bundle ID: com.meulookia.app")
        print("   5. Download GoogleService-Info.plist")
        
except Exception as e:
    print(f"❌ Erro ao listar apps: {e}")
    print("\n⚠️  Pode ser que não tenha permissão ou app não esteja cadastrado")

print("\n" + "="*60)
print("Bundle ID esperado: com.meulookia.app")
print("="*60)
