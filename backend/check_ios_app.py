#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, project_management
import pathlib

firebase_file = pathlib.Path(__file__).parent / 'firebase-service-account.json'
cred = credentials.Certificate(str(firebase_file))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

print("📱 Apps iOS no Firebase:\n")

ios_apps = project_management.list_ios_apps()
for app in ios_apps:
    print(f"App ID: {app.app_id}")
    # Tentar pegar mais detalhes
    try:
        print(f"Bundle ID: {app.bundle_id if hasattr(app, 'bundle_id') else 'N/A'}")
    except:
        pass
    print()

print("\n✅ Bundle ID esperado: com.meulookia.app")
print("\nSe o Bundle ID acima for DIFERENTE, esse é o problema!")
print("O token iOS foi gerado com um Bundle ID, mas o Firebase espera outro.")
