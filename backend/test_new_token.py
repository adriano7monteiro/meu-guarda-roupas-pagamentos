#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, messaging, exceptions as firebase_exceptions
import pathlib

firebase_file = pathlib.Path(__file__).parent / 'firebase-service-account.json'
cred = credentials.Certificate(str(firebase_file))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

ios_token = "fb251a992d035968e0fbe75df07b239eaec6da658c1fb1b9903e22729731fca9"

print(f"📱 Testando NOVO token iOS:")
print(f"   Token: {ios_token}")
print(f"   Length: {len(ios_token)}\n")

try:
    message = messaging.Message(
        notification=messaging.Notification(
            title="Teste Push iOS",
            body="Mensagem de teste",
        ),
        token=ios_token,
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title="Teste Push iOS",
                        body="Mensagem de teste",
                    ),
                    sound='default',
                    badge=1,
                ),
            ),
        ),
    )
    
    print("📤 Enviando notificação...")
    response = messaging.send(message)
    print(f"\n✅✅✅ SUCESSO! ✅✅✅")
    print(f"Message ID: {response}")
    print(f"\nO token está VÁLIDO e funcionando!")
    print(f"A notificação foi enviada com sucesso para o iPhone.\n")
    
except firebase_exceptions.InvalidArgumentError as e:
    print(f"\n❌ Erro InvalidArgumentError:")
    print(f"   {e}")
    
except Exception as e:
    print(f"\n❌ Erro: {type(e).__name__}")
    print(f"   {e}")
