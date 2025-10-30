#!/usr/bin/env python3
"""
Script para verificar onde e como as fotos são armazenadas
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "test_database")

client = MongoClient(mongo_url)
db = client[db_name]

print("=" * 70)
print("📸 ARMAZENAMENTO DE FOTOS - Meu Look IA")
print("=" * 70)

# 1. Fotos de corpo dos usuários
print("\n1️⃣  FOTOS DE CORPO (Usuários):")
print("-" * 70)

users_with_photo = list(db.users.find({"foto_corpo": {"$exists": True, "$ne": None}}))
total_users = db.users.count_documents({})

print(f"Total de usuários: {total_users}")
print(f"Usuários com foto de corpo: {len(users_with_photo)}")

total_size_photos = 0
for user in users_with_photo:
    foto = user.get('foto_corpo', '')
    size = len(foto) if foto else 0
    total_size_photos += size
    print(f"  - {user['email']}: {size / 1024:.2f} KB")

print(f"\n📊 Tamanho total de fotos de corpo: {total_size_photos / (1024*1024):.2f} MB")

# 2. Roupas
print("\n2️⃣  ROUPAS (Guarda-roupa):")
print("-" * 70)

roupas = list(db.clothes.find())
total_roupas = len(roupas)

print(f"Total de roupas cadastradas: {total_roupas}")

total_size_roupas = 0
roupas_por_usuario = {}

for roupa in roupas:
    user_id = roupa.get('user_id')
    imagem = roupa.get('imagem_original', '')
    size = len(imagem) if imagem else 0
    total_size_roupas += size
    
    if user_id not in roupas_por_usuario:
        roupas_por_usuario[user_id] = {'count': 0, 'size': 0}
    
    roupas_por_usuario[user_id]['count'] += 1
    roupas_por_usuario[user_id]['size'] += size

print(f"\n📊 Por usuário:")
for user_id, data in roupas_por_usuario.items():
    user = db.users.find_one({"id": user_id})
    email = user['email'] if user else 'Desconhecido'
    print(f"  - {email}: {data['count']} roupas, {data['size'] / 1024:.2f} KB")

print(f"\n📊 Tamanho total de roupas: {total_size_roupas / (1024*1024):.2f} MB")

# 3. Looks salvos
print("\n3️⃣  LOOKS SALVOS:")
print("-" * 70)

looks = list(db.looks.find())
total_looks = len(looks)

print(f"Total de looks salvos: {total_looks}")

total_size_looks = 0
looks_por_usuario = {}

for look in looks:
    user_id = look.get('user_id')
    imagem = look.get('imagem_look', '')
    size = len(imagem) if imagem else 0
    total_size_looks += size
    
    if user_id not in looks_por_usuario:
        looks_por_usuario[user_id] = {'count': 0, 'size': 0}
    
    looks_por_usuario[user_id]['count'] += 1
    looks_por_usuario[user_id]['size'] += size

print(f"\n📊 Por usuário:")
for user_id, data in looks_por_usuario.items():
    user = db.users.find_one({"id": user_id})
    email = user['email'] if user else 'Desconhecido'
    print(f"  - {email}: {data['count']} looks, {data['size'] / 1024:.2f} KB")

print(f"\n📊 Tamanho total de looks: {total_size_looks / (1024*1024):.2f} MB")

# 4. Total geral
print("\n" + "=" * 70)
print("📊 RESUMO GERAL:")
print("=" * 70)

total_all = total_size_photos + total_size_roupas + total_size_looks

print(f"Fotos de corpo:  {total_size_photos / (1024*1024):.2f} MB")
print(f"Roupas:          {total_size_roupas / (1024*1024):.2f} MB")
print(f"Looks gerados:   {total_size_looks / (1024*1024):.2f} MB")
print(f"-" * 70)
print(f"TOTAL:           {total_all / (1024*1024):.2f} MB")

print("\n" + "=" * 70)
print("💾 LOCAL DE ARMAZENAMENTO:")
print("=" * 70)
print(f"Banco de dados: MongoDB")
print(f"URL: {mongo_url}")
print(f"Database: {db_name}")
print(f"Coleções:")
print(f"  - users.foto_corpo (fotos de corpo)")
print(f"  - clothes.imagem_original (roupas)")
print(f"  - looks.imagem_look (looks gerados)")
print(f"\nFormato: Base64 (texto codificado)")
print(f"Armazenamento: Diretamente no MongoDB (sem arquivos)")

print("\n" + "=" * 70)

client.close()
