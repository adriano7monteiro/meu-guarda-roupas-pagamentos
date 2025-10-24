#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, messaging
import pathlib

firebase_file = pathlib.Path(__file__).parent / 'firebase-service-account.json'
cred = credentials.Certificate(str(firebase_file))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

ios_token = "d44e4fa5ad94d1216e7846e096a7eed0dffcece2ab006d00112c593ab01363bf"

print("📱 Testando token iOS")
print(f"Token: {ios_token}\n")

# Testar sem especificar ambiente (padrão = produção)
print("1️⃣ Teste: Modo padrão (produção)")
try:
    message = messaging.Message(
        notification=messaging.Notification(
            title="Teste iOS Produção",
            body="Teste",
        ),
        token=ios_token,
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title="Teste iOS",
                        body="Mensagem teste",
                    ),
                    sound='default',
                ),
            ),
        ),
    )
    response = messaging.send(message, dry_run=True)  # dry_run para não enviar de verdade
    print(f"   ✅ Token VÁLIDO para produção!")
    print(f"   Message ID: {response}\n")
except Exception as e:
    print(f"   ❌ FALHOU em produção: {e}\n")

# Verificar se o problema é ambiente
print("\n🔍 Análise:")
print("Se deu erro acima, o token pode ser de SANDBOX (desenvolvimento)")
print("\nPara resolver:")
print("1. Use um iPhone com o app de PRODUÇÃO (da App Store ou TestFlight)")
print("2. Ou configure APNs para aceitar tokens de desenvolvimento")
print("\nVerifique no Firebase Console:")
print("   → A chave APNs que você configurou é de PRODUÇÃO?")
print("   → Key ID: 7V3XCY46LP")
print("   → Team ID: C88Z4WK6J2")
