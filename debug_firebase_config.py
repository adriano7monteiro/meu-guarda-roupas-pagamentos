#!/usr/bin/env python3
import json
import pathlib

# Ler o firebase-service-account.json
firebase_file = pathlib.Path(__file__).parent / 'firebase-service-account.json'
with open(firebase_file) as f:
    config = json.load(f)

print("🔍 Configuração Firebase:")
print(f"   Project ID: {config['project_id']}")
print(f"   Client Email: {config['client_email']}")
print(f"   Private Key ID: {config['private_key_id']}")

print("\n📱 Informações necessárias:")
print("   1. Bundle ID do seu app iOS:")
print("      → Deve ser algo como: com.meulookia.app")
print("      → Verificar em: app.config.js → ios.bundleIdentifier")
print()
print("   2. No Firebase Console, verifique:")
print("      → Project Settings → General → Your apps")
print("      → Deve ter um app iOS cadastrado")
print("      → Bundle ID deve corresponder ao do app")
print()
print("   3. No Firebase Console, verifique APNs:")
print("      → Project Settings → Cloud Messaging")
print("      → Seção 'Apple app configuration'")
print("      → Deve mostrar: Key ID e Team ID")
print()
print("   4. Ambiente do token:")
print("      → Token de desenvolvimento (sandbox) vs produção")
print("      → APNs tem ambientes separados")
