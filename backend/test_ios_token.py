#!/usr/bin/env python3
import os
import json
import firebase_admin
from firebase_admin import credentials, messaging, exceptions as firebase_exceptions

# Inicializar Firebase
firebase_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
if firebase_json:
    firebase_config = json.loads(firebase_json)
    cred = credentials.Certificate(firebase_config)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    print("✅ Firebase inicializado via ENV")
else:
    # Tentar arquivo local
    import pathlib
    firebase_file = pathlib.Path(__file__).parent / 'firebase-service-account.json'
    if firebase_file.exists():
        cred = credentials.Certificate(str(firebase_file))
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        print("✅ Firebase inicializado via arquivo local")
    else:
        print("❌ FIREBASE_SERVICE_ACCOUNT não encontrado")
        exit(1)

# Token iOS para testar
ios_token = "d44e4fa5ad94d1216e7846e096a7eed0dffcece2ab006d00112c593ab01363bf"

print(f"\n📱 Testando token iOS:")
print(f"   Token: {ios_token}")
print(f"   Length: {len(ios_token)} caracteres")
print(f"   Tipo: {'iOS APNs' if len(ios_token) == 64 else 'Outro'}")

# Criar mensagem de teste
try:
    message = messaging.Message(
        notification=messaging.Notification(
            title="Teste iOS",
            body="Mensagem de teste para iOS",
        ),
        token=ios_token,
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title="Teste iOS",
                        body="Mensagem de teste para iOS",
                    ),
                    sound='default',
                    badge=1,
                ),
            ),
        ),
    )
    
    print("\n📤 Enviando mensagem...")
    response = messaging.send(message)
    print(f"✅ SUCESSO! Message ID: {response}")
    
except firebase_exceptions.InvalidArgumentError as e:
    print(f"\n❌ Erro InvalidArgumentError:")
    print(f"   {e}")
    print(f"\n🔍 Análise:")
    error_str = str(e).lower()
    if "apns" in error_str or "ios" in error_str:
        print("   → Problema relacionado a APNs/iOS")
        print("   → Verifique se APNs está configurado no Firebase Console")
    elif "registration token" in error_str:
        print("   → Token não é válido para Firebase")
        print("   → Pode ser que APNs não esteja configurado no Firebase Console")
    else:
        print(f"   → Erro genérico: {error_str}")
        
except firebase_exceptions.UnregisteredError as e:
    print(f"\n❌ Erro UnregisteredError:")
    print(f"   {e}")
    print(f"   → Token não está mais registrado")
    
except Exception as e:
    print(f"\n❌ Erro inesperado: {type(e).__name__}")
    print(f"   {e}")
