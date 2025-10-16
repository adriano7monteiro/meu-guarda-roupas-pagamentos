from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
import base64
import json
import random
import traceback
from email_service import email_service
from openai import AsyncOpenAI
from google.oauth2 import service_account
from googleapiclient.discovery import build

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI client initialization
openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# JWT Secret (in production, use a secure secret)
JWT_SECRET = os.environ.get('JWT_SECRET', 'meu-look-ia-secret-key-2025-default-CHANGE-IN-PRODUCTION')
security = HTTPBearer()

# Google Play configuration (optional, for production)
GOOGLE_PLAY_SERVICE_ACCOUNT_FILE = os.environ.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', None)
GOOGLE_PACKAGE_NAME = os.environ.get('GOOGLE_PACKAGE_NAME', 'com.meulookia.app')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    nome: str
    foto_corpo: Optional[str] = None
    ocasiao_preferida: str = "casual"
    looks_usados: int = 0  # Contador de looks gratuitos usados
    plano_ativo: str = "free"  # free, mensal, semestral, anual
    
    # Google Play Subscription Fields
    google_play_purchase_token: Optional[str] = None  # Token da compra/assinatura
    google_play_order_id: Optional[str] = None  # ID do pedido
    google_play_subscription_id: Optional[str] = None  # ID da subscription (mensal/anual)
    google_play_expiry_time: Optional[datetime] = None  # Quando a subscription expira
    google_play_auto_renewing: Optional[bool] = None  # Se está com renovação automática ativa
    google_play_payment_state: Optional[int] = None  # 0=pending, 1=received, 2=free_trial, 3=pending_deferred
    
    # Apple (futuro)
    apple_transaction_id: Optional[str] = None  # ID da transação da Apple
    
    data_expiracao_plano: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    nome: str
    ocasiao_preferida: str = "casual"

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    email: str
    nome: str
    foto_corpo: Optional[str] = None
    ocasiao_preferida: str
    created_at: datetime

class ClothingItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tipo: str  # camiseta, calca, sapato, acessorio
    cor: str
    estilo: str
    imagem_original: str  # base64
    nome: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClothingItemCreate(BaseModel):
    tipo: str
    cor: str
    estilo: str
    nome: str
    imagem_original: str

class Look(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    nome: str
    roupas_ids: List[str]
    ocasiao: str
    clima: Optional[str] = None
    favorito: bool = False
    imagem_look: Optional[str] = None  # base64 da simulação
    sugestao_ia: Optional[str] = None  # Texto da sugestão gerado pela IA
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LookCreate(BaseModel):
    nome: str
    roupas_ids: List[str]
    ocasiao: str
    clima: Optional[str] = None
    imagem_look: Optional[str] = None
    sugestao_ia: Optional[str] = None

class SugestaoLook(BaseModel):
    sugestao_texto: str
    roupas_sugeridas: List[str]
    ocasiao: str
    clima: str

class Plan(BaseModel):
    id: str
    name: str
    price: int  # em centavos
    interval: str  # month, year
    interval_count: int = 1
    features: List[str]
    badge: Optional[str] = None
    color: str
    active: bool = True

class Suggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    mensagem: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SuggestionCreate(BaseModel):
    mensagem: str

class PurchaseVerification(BaseModel):
    platform: str  # "android" or "ios"
    productId: str  # "mensal", "semestral", "anual"
    purchaseToken: Optional[str] = None  # Android
    transactionReceipt: Optional[str] = None  # iOS
    transactionId: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Auth routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password_hash"] = hash_password(user_data.password)
    del user_dict["password"]
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    
    # Create JWT token
    token = create_jwt_token(user.id)
    
    return {
        "token": token,
        "user": UserProfile(
            email=user.email,
            nome=user.nome,
            foto_corpo=user.foto_corpo,
            ocasiao_preferida=user.ocasiao_preferida,
            created_at=user.created_at
        )
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_jwt_token(user["id"])
    
    return {
        "token": token,
        "user": UserProfile(
            email=user["email"],
            nome=user["nome"],
            foto_corpo=user.get("foto_corpo"),
            ocasiao_preferida=user["ocasiao_preferida"],
            created_at=user["created_at"]
        )
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user=Depends(security)):
    user = await get_current_user(current_user)
    return UserProfile(
        email=user["email"],
        nome=user["nome"],
        foto_corpo=user.get("foto_corpo"),
        ocasiao_preferida=user["ocasiao_preferida"],
        created_at=user["created_at"]
    )

# Password Reset Routes
class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetVerify(BaseModel):
    email: str
    code: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """
    Envia código de recuperação de senha por email
    """
    try:
        # Verificar se usuário existe
        user = await db.users.find_one({"email": request.email})
        if not user:
            # Por segurança, não revelar se o email existe ou não
            return {
                "success": True,
                "message": "Se este email estiver cadastrado, você receberá um código de recuperação"
            }
        
        # Gerar código de 6 dígitos
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Salvar código no banco com expiração de 30 minutos
        expiration = datetime.utcnow() + timedelta(minutes=30)
        
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "reset_code": code,
                    "reset_code_expires": expiration
                }
            }
        )
        
        # Enviar email
        email_sent = email_service.send_password_reset_code(request.email, code)
        
        if not email_sent:
            logging.error(f"Failed to send password reset email to {request.email}")
            logging.warning(f"[DEV MODE] Password reset code for {request.email}: {code}")
            
            # Em desenvolvimento, retornar o código na resposta quando email falhar
            # IMPORTANTE: Remover em produção!
            return {
                "success": True,
                "message": "Não foi possível enviar o email. Use o código abaixo (modo desenvolvimento)",
                "dev_code": code,  # REMOVER EM PRODUÇÃO
                "note": "Configure o SendGrid corretamente antes de usar em produção"
            }
        
        logging.info(f"Password reset code sent to {request.email}")
        
        return {
            "success": True,
            "message": "Código de recuperação enviado para seu email"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in forgot_password: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar solicitação")

@api_router.post("/auth/reset-password")
async def reset_password(request: PasswordResetVerify):
    """
    Verifica código e redefine senha
    """
    try:
        # Buscar usuário
        user = await db.users.find_one({"email": request.email})
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Verificar se tem código de reset
        if not user.get("reset_code"):
            raise HTTPException(status_code=400, detail="Nenhum código de recuperação solicitado")
        
        # Verificar expiração
        if datetime.utcnow() > user.get("reset_code_expires", datetime.utcnow()):
            await db.users.update_one(
                {"id": user["id"]},
                {"$unset": {"reset_code": "", "reset_code_expires": ""}}
            )
            raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo código")
        
        # Verificar código
        if user.get("reset_code") != request.code:
            raise HTTPException(status_code=400, detail="Código inválido")
        
        # Atualizar senha
        password_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt())
        
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {"password_hash": password_hash.decode('utf-8')},
                "$unset": {"reset_code": "", "reset_code_expires": ""}
            }
        )
        
        logging.info(f"Password reset successful for {request.email}")
        
        return {
            "success": True,
            "message": "Senha redefinida com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in reset_password: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao redefinir senha")

# Profile routes
@api_router.post("/upload-foto-corpo")
async def upload_foto_corpo(
    imagem: str = Form(...),
    current_user=Depends(security)
):
    user = await get_current_user(current_user)
    
    # Update user's body photo
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"foto_corpo": imagem}}
    )
    
    return {"message": "Foto do corpo atualizada com sucesso"}

# Virtual Try-on route
@api_router.post("/gerar-look-visual")
async def gerar_look_visual(
    roupa_ids: List[str] = Form(...),
    current_user=Depends(security)
):
    try:
        user = await get_current_user(current_user)
        logging.info(f"Generating visual look for user: {user['id']}")
        
        # Check subscription/plan limits
        looks_usados = user.get("looks_usados", 0)
        plano_ativo = user.get("plano_ativo", "free")
        data_expiracao = user.get("data_expiracao_plano")
        
        # Verify if user has access to generate looks
        tem_plano_ativo = False
        if plano_ativo != "free" and data_expiracao:
            # Check if plan is still valid
            if data_expiracao > datetime.utcnow():
                tem_plano_ativo = True
            else:
                # Plan expired, reset to free
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"plano_ativo": "free", "data_expiracao_plano": None}}
                )
                plano_ativo = "free"
        
        # Check if free user exceeded limit
        if plano_ativo == "free" and looks_usados >= 5:
            raise HTTPException(
                status_code=403, 
                detail="Você atingiu o limite de 5 looks gratuitos. Assine um plano para continuar usando!"
            )
        
        # Get user's body photo
        if not user.get("foto_corpo"):
            raise HTTPException(status_code=400, detail="Você precisa fazer upload da sua foto do corpo primeiro no perfil.")
        
        # Get selected clothing items
        clothing_items = []
        for roupa_id in roupa_ids:
            roupa = await db.clothing_items.find_one({
                "id": roupa_id,
                "user_id": user["id"]
            })
            if roupa:
                clothing_items.append(roupa)
        
        if not clothing_items:
            raise HTTPException(status_code=400, detail="Nenhuma roupa válida selecionada.")
        
        # Limit to 3 garments maximum
        if len(clothing_items) > 3:
            raise HTTPException(
                status_code=400, 
                detail="Limite de 3 peças de roupa por look. Selecione no máximo 3 itens."
            )
        
        logging.info(f"Processing {len(clothing_items)} clothing items for sequential try-on")
        
        # Sequential try-on: apply each garment one by one
        current_image = user["foto_corpo"]  # Start with user's body photo
        
        import requests
        fal_api_url = "https://fal.run/fal-ai/fashn/tryon/v1.5"
        headers = {
            "Authorization": f"Key {os.environ.get('FAL_API_KEY')}",
            "Content-Type": "application/json"
        }
        
        processed_items = []
        
        for idx, clothing in enumerate(clothing_items, 1):
            logging.info(f"[TRYON {idx}/{len(clothing_items)}] Processing: {clothing['nome']} ({clothing['tipo']}, {clothing['cor']})")
            
            # Verify images are base64 format
            if not current_image.startswith("data:image/"):
                logging.error(f"Invalid model image format at step {idx}")
                raise HTTPException(status_code=400, detail=f"Erro no formato da imagem na etapa {idx}")
            
            if not clothing.get("imagem_original", "").startswith("data:image/"):
                logging.error(f"Invalid clothing image format: {clothing['nome']}")
                raise HTTPException(status_code=400, detail=f"Erro no formato da imagem da roupa: {clothing['nome']}")
            
            # Mapear tipos em português para descrições em inglês (para description)
            garment_type_description = {
                "camiseta": "t-shirt",
                "camisa": "shirt",
                "blusa": "blouse",
                "calca": "pants",
                "jeans": "jeans",
                "short": "shorts",
                "saia": "skirt",
                "vestido": "dress",
                "jaqueta": "jacket",
                "casaco": "coat",
                "moletom": "hoodie",
                "tenis": "sneakers",
                "sapato": "shoes",
                "sandalia": "sandals",
                "bota": "boots",
                "bone": "cap",
                "chapeu": "hat",
                "oculos": "sunglasses",
                "relogio": "watch",
                "bolsa": "bag",
                "colar": "necklace",
                "pulseira": "bracelet"
            }
            
            # Mapear para categorias da API Fal.ai (tops, bottoms, one-pieces, auto)
            garment_category_map = {
                "camiseta": "tops",
                "camisa": "tops",
                "blusa": "tops",
                "jaqueta": "tops",
                "casaco": "tops",
                "moletom": "tops",
                "calca": "bottoms",
                "jeans": "bottoms",
                "short": "bottoms",
                "saia": "bottoms",
                "vestido": "one-pieces",
                "tenis": "bottoms",
                "sapato": "bottoms",
                "sandalia": "bottoms",
                "bota": "bottoms",
                "bone": "auto",
                "chapeu": "auto",
                "oculos": "auto",
                "relogio": "auto",
                "bolsa": "auto",
                "colar": "auto",
                "pulseira": "auto"
            }
            
            # Obter tipo em inglês para descrição
            garment_type_en = garment_type_description.get(clothing['tipo'].lower(), clothing['tipo'])
            # Obter categoria da API
            garment_category = garment_category_map.get(clothing['tipo'].lower(), "auto")
            
            # Criar descrição detalhada para melhor reconhecimento
            description = f"{clothing['cor']} {garment_type_en}"
            if clothing.get('nome'):
                description = f"{description} - {clothing['nome']}"
            
            # Prepare API payload
            payload = {
                "model_image": current_image,  # Current image (user photo or previous result)
                "garment_image": clothing["imagem_original"],
                "description": description,
                "category": garment_category  # Usar categoria da API (tops/bottoms/one-pieces/auto)
            }
            
            logging.info(f"[TRYON {idx}/{len(clothing_items)}] Calling Fal.ai API...")
            
            try:
                # Make API call
                api_response = requests.post(fal_api_url, json=payload, headers=headers, timeout=60)
                
                if api_response.status_code == 200:
                    fal_result = api_response.json()
                    logging.info(f"[TRYON {idx}/{len(clothing_items)}] Success! Response keys: {list(fal_result.keys())}")
                    
                    # Extract generated image URL
                    generated_image = None
                    
                    if "images" in fal_result and len(fal_result["images"]) > 0:
                        generated_image = fal_result["images"][0]["url"]
                    elif "data" in fal_result and "url" in fal_result["data"]:
                        generated_image = fal_result["data"]["url"]
                    elif "image" in fal_result:
                        if isinstance(fal_result["image"], dict):
                            generated_image = fal_result["image"].get("url")
                        elif isinstance(fal_result["image"], str):
                            generated_image = fal_result["image"]
                    elif "url" in fal_result:
                        generated_image = fal_result["url"]
                    
                    if not generated_image:
                        logging.error(f"[TRYON {idx}/{len(clothing_items)}] Could not extract image from response")
                        raise HTTPException(status_code=500, detail=f"Erro ao processar peça {idx}: {clothing['nome']}")
                    
                    # Download the image and convert to base64 for next iteration
                    import base64
                    image_response = requests.get(generated_image, timeout=30)
                    if image_response.status_code == 200:
                        # Convert to base64 data URI
                        image_base64 = base64.b64encode(image_response.content).decode('utf-8')
                        current_image = f"data:image/png;base64,{image_base64}"
                        logging.info(f"[TRYON {idx}/{len(clothing_items)}] Downloaded and converted image to base64 ({len(current_image)} chars)")
                    else:
                        logging.error(f"[TRYON {idx}/{len(clothing_items)}] Failed to download image")
                        raise HTTPException(status_code=500, detail=f"Erro ao baixar imagem da peça {idx}")
                    
                    processed_items.append({
                        "id": clothing["id"],
                        "nome": clothing["nome"],
                        "tipo": clothing["tipo"],
                        "cor": clothing["cor"]
                    })
                    
                    logging.info(f"[TRYON {idx}/{len(clothing_items)}] ✅ Complete!")
                    
                else:
                    logging.error(f"[TRYON {idx}/{len(clothing_items)}] API error: {api_response.status_code} - {api_response.text}")
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Erro na API Fal.ai ao processar peça {idx}: {clothing['nome']}"
                    )
                    
            except requests.exceptions.Timeout:
                logging.error(f"[TRYON {idx}/{len(clothing_items)}] Timeout")
                raise HTTPException(status_code=504, detail=f"Timeout ao processar peça {idx}: {clothing['nome']}")
            except requests.exceptions.RequestException as e:
                logging.error(f"[TRYON {idx}/{len(clothing_items)}] Request error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Erro de conexão ao processar peça {idx}")
        
        # All items processed successfully!
        logging.info(f"✅ All {len(clothing_items)} items processed successfully!")
        
        # current_image now contains the result with all garments applied
        result = {
            "message": f"Look gerado com sucesso com {len(clothing_items)} {'peça' if len(clothing_items) == 1 else 'peças'}!",
            "clothing_items": processed_items,
            "tryon_image": current_image,  # Final result with all garments
            "status": "success",
            "note": f"Try-on virtual com {len(clothing_items)} peças criado com IA!",
            "api_used": "fal.ai-fashn-sequential"
        }
        
        # Increment user's looks counter (only once, not per garment)
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"looks_usados": 1}}
        )
        
        logging.info(f"Incremented looks counter for user {user['id']}: {looks_usados + 1}/{5 if plano_ativo == 'free' else 'unlimited'}")
        logging.info(f"Virtual try-on completed for {len(clothing_items)} items")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in virtual try-on: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar look: {str(e)}")

# Clothing routes
@api_router.post("/upload-roupa")
async def upload_roupa(
    roupa_data: ClothingItemCreate,
    current_user=Depends(security)
):
    try:
        user = await get_current_user(current_user)
        logging.info(f"Upload roupa - User: {user['id']}")
        
        # Create clothing item
        clothing_dict = roupa_data.dict()
        clothing_dict["user_id"] = user["id"]
        
        logging.info(f"Upload roupa - Image size: {len(roupa_data.imagem_original) if roupa_data.imagem_original else 0}")
        
        clothing = ClothingItem(**clothing_dict)
        result = await db.clothing_items.insert_one(clothing.dict())
        
        logging.info(f"Upload roupa - Inserted with ID: {result.inserted_id}")
        
        return {"message": "Roupa cadastrada com sucesso", "id": clothing.id}
    except Exception as e:
        logging.error(f"Error in upload_roupa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/roupas")
async def get_roupas(
    skip: int = 0, 
    limit: int = 20,
    current_user=Depends(security)
):
    user = await get_current_user(current_user)
    
    # Get total count for pagination info
    total = await db.clothing_items.count_documents({"user_id": user["id"]})
    
    # Get paginated results
    roupas = await db.clothing_items.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "items": roupas,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }

@api_router.delete("/roupas/{roupa_id}")
async def delete_roupa(roupa_id: str, current_user=Depends(security)):
    user = await get_current_user(current_user)
    
    result = await db.clothing_items.delete_one({
        "id": roupa_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Roupa não encontrada")
    
    return {"message": "Roupa removida com sucesso"}

# Look generation routes
@api_router.post("/sugerir-look")
async def sugerir_look(
    ocasiao: str = Form(...),
    temperatura: Optional[str] = Form(None),
    detalhes_contexto: Optional[str] = Form(None),
    current_user=Depends(security)
):
    user = await get_current_user(current_user)
    
    # Get user's clothing items
    roupas = await db.clothing_items.find({"user_id": user["id"]}).to_list(1000)
    
    if not roupas:
        raise HTTPException(status_code=400, detail="Você precisa cadastrar roupas primeiro")
    
    # Prepare context for AI
    roupas_context = []
    for roupa in roupas:
        roupas_context.append({
            "id": roupa["id"],
            "tipo": roupa["tipo"],
            "cor": roupa["cor"],
            "estilo": roupa["estilo"],
            "nome": roupa["nome"]
        })
    
    # Create list of valid IDs for the prompt
    valid_ids = [r["id"] for r in roupas_context]
    
    # Create AI prompt
    contexto_adicional = f"\nDetalhes adicionais fornecidos pelo usuário: {detalhes_contexto}" if detalhes_contexto else ""
    
    prompt = f"""
    Como personal stylist virtual, sugira uma combinação de roupas para o usuário.
    
    Ocasião: {ocasiao}
    Temperatura: {temperatura or "não informada"}{contexto_adicional}
    
    Roupas disponíveis no guarda-roupa do usuário:
    {json.dumps(roupas_context, indent=2, ensure_ascii=False)}
    
    IDs VÁLIDOS que você DEVE usar (copie exatamente):
    {json.dumps(valid_ids, indent=2)}
    
    Crie uma sugestão de look detalhada. Responda APENAS com JSON válido (sem markdown):
    {{
        "sugestao_texto": "Uma explicação detalhada e elegante da combinação sugerida. Use parágrafos e seja descritivo sobre as cores, estilos e como as peças combinam entre si.",
        "roupas_ids": ["cole aqui os IDs da lista acima"],
        "dicas": "Dicas práticas de estilo e acessórios"
    }}
    
    ⚠️ REGRAS OBRIGATÓRIAS: 
    1. No campo "roupas_ids", copie EXATAMENTE os IDs da lista "IDs VÁLIDOS" acima
    2. NUNCA use nomes como "jaqueta_jeans" ou "tenis_branco" - use apenas os IDs UUID
    3. Um ID válido tem este formato: "4b4914ed-0f45-47a9-bef3-d0178e603776"
    4. Escolha 2 a 4 peças que combinem bem
    5. No "sugestao_texto", mencione as peças pelo campo "nome" da lista
    """
    
    try:
        # Call OpenAI API directly
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Você é um personal stylist virtual especializado em combinações de roupas."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        response = completion.choices[0].message.content
        
        # Parse response
        try:
            # Clean up markdown code blocks if present
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]  # Remove ```json
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]  # Remove ```
            clean_response = clean_response.strip()
            
            ai_response = json.loads(clean_response)
            return {
                "sugestao_texto": ai_response.get("sugestao_texto", ""),
                "roupas_ids": ai_response.get("roupas_ids", []),
                "dicas": ai_response.get("dicas", ""),
                "ocasiao": ocasiao,
                "temperatura": temperatura
            }
        except json.JSONDecodeError:
            # If JSON parsing fails, create a formatted response from the raw text
            logging.warning(f"Failed to parse JSON response: {response[:200]}...")
            
            # Clean up the raw response to make it more readable
            clean_response = response.strip()
            
            # Remove JSON formatting if present
            if clean_response.startswith('{') and clean_response.endswith('}'):
                # Try to extract text between quotes if it looks like malformed JSON
                clean_response = clean_response.replace('{"sugestao_texto":', '').replace('"', '').strip()
            
            # Format as readable text
            formatted_text = f"Para a ocasião '{ocasiao}', sugiro uma combinação elegante das suas roupas disponíveis. "
            
            if clean_response and len(clean_response) > 10:
                formatted_text = clean_response
            else:
                # Create a basic suggestion based on available clothes
                if roupas:
                    selected_clothes = roupas[:3]  # Take first 3 items
                    clothes_names = [r["nome"] for r in selected_clothes]
                    formatted_text = f"Para a ocasião '{ocasiao}', recomendo combinar: {', '.join(clothes_names)}. Essas peças criam um look harmonioso e adequado para a situação."
                
            return {
                "sugestao_texto": formatted_text,
                "roupas_ids": [roupa["id"] for roupa in roupas[:3]],  # Fallback
                "dicas": "Lembre-se de ajustar os acessórios conforme a ocasião e considere o conforto além do estilo.",
                "ocasiao": ocasiao,
                "temperatura": temperatura
            }
            
    except Exception as e:
        logging.error(f"Error in AI suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao gerar sugestão de look")

# Look management routes
@api_router.post("/looks")
async def create_look(
    look_data: LookCreate,
    current_user=Depends(security)
):
    user = await get_current_user(current_user)
    
    logging.info(f"Creating look for user {user['id']}")
    logging.info(f"Look data: {look_data.dict()}")
    logging.info(f"Roupas IDs to validate: {look_data.roupas_ids}")
    
    # Validate that all clothing items exist and belong to user
    for roupa_id in look_data.roupas_ids:
        logging.info(f"Validating roupa_id: {roupa_id}")
        roupa = await db.clothing_items.find_one({
            "id": roupa_id,
            "user_id": user["id"]
        })
        logging.info(f"Found roupa: {roupa is not None}")
        if not roupa:
            # Check if the item exists for any user
            any_roupa = await db.clothing_items.find_one({"id": roupa_id})
            if any_roupa:
                logging.error(f"Roupa {roupa_id} exists but belongs to user {any_roupa.get('user_id')}, not {user['id']}")
            else:
                logging.error(f"Roupa {roupa_id} does not exist in database")
            raise HTTPException(status_code=400, detail=f"Roupa {roupa_id} não encontrada")
    
    # Create look
    look_dict = look_data.dict()
    look_dict["user_id"] = user["id"]
    
    look = Look(**look_dict)
    await db.looks.insert_one(look.dict())
    
    logging.info(f"Look created successfully: {look.id}")
    return {"message": "Look salvo com sucesso", "id": look.id}

@api_router.get("/looks")
async def get_looks(
    skip: int = 0,
    limit: int = 20,
    current_user=Depends(security)
):
    user = await get_current_user(current_user)
    
    # Get total count for pagination info
    total = await db.looks.count_documents({"user_id": user["id"]})
    
    # Get paginated results
    looks = await db.looks.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "items": looks,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }

@api_router.get("/looks/stats/favoritos")
async def get_favoritos_count(current_user=Depends(security)):
    """Retorna a contagem de looks favoritados"""
    user = await get_current_user(current_user)
    
    # Count looks where favorito = true
    favoritos_count = await db.looks.count_documents({
        "user_id": user["id"],
        "favorito": True
    })
    
    return {"count": favoritos_count}

@api_router.post("/looks/{look_id}/favoritar")
async def toggle_favorite_look(look_id: str, current_user=Depends(security)):
    user = await get_current_user(current_user)
    
    look = await db.looks.find_one({
        "id": look_id,
        "user_id": user["id"]
    })
    
    if not look:
        raise HTTPException(status_code=404, detail="Look não encontrado")
    
    new_favorite_status = not look.get("favorito", False)
    
    await db.looks.update_one(
        {"id": look_id, "user_id": user["id"]},
        {"$set": {"favorito": new_favorite_status}}
    )
    
    return {"message": f"Look {'adicionado aos' if new_favorite_status else 'removido dos'} favoritos"}

@api_router.delete("/looks/{look_id}")
async def delete_look(look_id: str, current_user=Depends(security)):
    user = await get_current_user(current_user)
    
    result = await db.looks.delete_one({
        "id": look_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Look não encontrado")
    
    return {"message": "Look removido com sucesso"}

# Subscription/Payment models
class CreateSubscriptionRequest(BaseModel):
    plano: str  # mensal, semestral, anual
    
class SubscriptionResponse(BaseModel):
    client_secret: str
    subscription_id: str

# Subscription routes
# Google Play / In-App Purchase routes
@api_router.post("/verify-purchase")
async def verify_purchase(
    purchase: PurchaseVerification,
    current_user=Depends(security)
):
    """
    Verifica compra do Google Play ou Apple e ativa assinatura
    """
    try:
        user = await get_current_user(current_user)
        logging.info(f"🛒 Verifying purchase for user {user['id']}, platform: {purchase.platform}, product: {purchase.productId}")
        
        # Validar produto
        valid_products = ["mensal", "semestral", "anual"]
        if purchase.productId not in valid_products:
            raise HTTPException(status_code=400, detail=f"Produto inválido: {purchase.productId}")
        
        # ANDROID: Google Play Billing
        if purchase.platform == "android":
            if not purchase.purchaseToken:
                raise HTTPException(status_code=400, detail="purchaseToken é obrigatório para Android")
            
            # Verificar com Google Play API (se configurado)
            subscription_data = None
            if GOOGLE_PLAY_SERVICE_ACCOUNT_FILE and os.path.exists(GOOGLE_PLAY_SERVICE_ACCOUNT_FILE):
                try:
                    credentials = service_account.Credentials.from_service_account_file(
                        GOOGLE_PLAY_SERVICE_ACCOUNT_FILE,
                        scopes=['https://www.googleapis.com/auth/androidpublisher']
                    )
                    
                    service = build('androidpublisher', 'v3', credentials=credentials)
                    
                    # Verificar compra de assinatura
                    result = service.purchases().subscriptions().get(
                        packageName=GOOGLE_PACKAGE_NAME,
                        subscriptionId=purchase.productId,
                        token=purchase.purchaseToken
                    ).execute()
                    
                    logging.info(f"✅ Google Play API response: {result}")
                    
                    # Verificar se a compra é válida
                    payment_state = result.get('paymentState', 0)
                    if payment_state not in [1, 2]:  # 1=Payment received, 2=Free trial
                        raise HTTPException(status_code=400, detail="Pagamento não confirmado pelo Google Play")
                    
                    # Extrair informações importantes
                    subscription_data = {
                        'expiry_time_millis': result.get('expiryTimeMillis'),
                        'auto_renewing': result.get('autoRenewing', False),
                        'payment_state': payment_state,
                        'order_id': result.get('orderId'),
                        'price_currency_code': result.get('priceCurrencyCode'),
                        'price_amount_micros': result.get('priceAmountMicros'),
                    }
                    
                    logging.info(f"✅ Google Play purchase verified successfully")
                    
                except Exception as e:
                    logging.error(f"❌ Error verifying Google Play purchase: {str(e)}")
                    # Em desenvolvimento, continuar mesmo com erro de verificação
                    logging.warning("⚠️ Continuing without Google Play verification (development mode)")
            else:
                logging.warning("⚠️ Google Play Service Account not configured. Skipping verification (development mode)")
        
        # iOS: Apple In-App Purchase (futuro)
        elif purchase.platform == "ios":
            if not purchase.transactionReceipt:
                raise HTTPException(status_code=400, detail="transactionReceipt é obrigatório para iOS")
            
            logging.warning("⚠️ iOS verification not implemented yet")
            # TODO: Implementar verificação com Apple StoreKit API
        
        else:
            raise HTTPException(status_code=400, detail=f"Plataforma inválida: {purchase.platform}")
        
        # Calcular data de expiração baseado no Google Play ou fallback manual
        now = datetime.utcnow()
        if subscription_data and subscription_data.get('expiry_time_millis'):
            # Usar data de expiração do Google Play (mais precisa)
            expiry_millis = int(subscription_data['expiry_time_millis'])
            expiration_date = datetime.fromtimestamp(expiry_millis / 1000.0)
        else:
            # Fallback: calcular manualmente
            if purchase.productId == "mensal":
                expiration_date = now + timedelta(days=30)
            elif purchase.productId == "semestral":
                expiration_date = now + timedelta(days=180)
            elif purchase.productId == "anual":
                expiration_date = now + timedelta(days=365)
        
        # Atualizar usuário com plano ativo e TODAS as informações da subscription
        update_data = {
            "plano_ativo": purchase.productId,
            "data_expiracao_plano": expiration_date,
        }
        
        # Salvar informações completas do Google Play
        if purchase.platform == "android":
            update_data["google_play_purchase_token"] = purchase.purchaseToken
            update_data["google_play_subscription_id"] = purchase.productId
            
            if purchase.transactionId:
                update_data["google_play_order_id"] = purchase.transactionId
            
            # Salvar informações da API (se disponível)
            if subscription_data:
                update_data["google_play_expiry_time"] = expiration_date
                update_data["google_play_auto_renewing"] = subscription_data.get('auto_renewing', True)
                update_data["google_play_payment_state"] = subscription_data.get('payment_state', 1)
                
                if subscription_data.get('order_id'):
                    update_data["google_play_order_id"] = subscription_data['order_id']
        
        elif purchase.platform == "ios":
            update_data["apple_transaction_id"] = purchase.transactionId
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": update_data}
        )
        
        logging.info(f"✅ Subscription activated: {purchase.productId} for user {user['id']}, expires: {expiration_date.strftime('%d/%m/%Y %H:%M')}")
        logging.info(f"📊 Auto-renewing: {update_data.get('google_play_auto_renewing', 'N/A')}")
        
        return {
            "success": True,
            "message": f"Assinatura {purchase.productId} ativada com sucesso!",
            "plano_ativo": purchase.productId,
            "data_expiracao": expiration_date.isoformat(),
            "auto_renewing": update_data.get("google_play_auto_renewing", True),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ Error in verify_purchase: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao verificar compra: {str(e)}")


# Google Play Real-time Developer Notifications (RTDN) Webhook
@api_router.post("/google-play-webhook")
async def google_play_webhook(request: Request):
    """
    Recebe notificações em tempo real do Google Play sobre mudanças de status de assinatura
    
    Documentação: https://developer.android.com/google/play/billing/rtdn-reference
    """
    try:
        # Receber o corpo da requisição
        body = await request.json()
        logging.info(f"[GOOGLE_PLAY_WEBHOOK] Received notification: {json.dumps(body, indent=2)}")
        
        # Extrair a mensagem do Pub/Sub
        if 'message' not in body:
            logging.error("[GOOGLE_PLAY_WEBHOOK] No message field in request")
            return {"status": "error", "message": "No message field"}
        
        message_data = body['message']
        
        # Decodificar o base64 data
        import base64
        if 'data' not in message_data:
            logging.error("[GOOGLE_PLAY_WEBHOOK] No data field in message")
            return {"status": "error", "message": "No data field"}
        
        decoded_data = base64.b64decode(message_data['data']).decode('utf-8')
        notification = json.loads(decoded_data)
        
        logging.info(f"[GOOGLE_PLAY_WEBHOOK] Decoded notification: {json.dumps(notification, indent=2)}")
        
        # Verificar se é notificação de subscription
        if 'subscriptionNotification' not in notification:
            logging.warning("[GOOGLE_PLAY_WEBHOOK] Not a subscription notification, ignoring")
            return {"status": "ok", "message": "Not a subscription notification"}
        
        sub_notification = notification['subscriptionNotification']
        
        # Extrair informações importantes
        notification_type = sub_notification.get('notificationType')
        subscription_id = sub_notification.get('subscriptionId')  # mensal, semestral, anual
        purchase_token = sub_notification.get('purchaseToken')
        
        logging.info(f"[GOOGLE_PLAY_WEBHOOK] Type: {notification_type}, Subscription: {subscription_id}, Token: {purchase_token[:20]}...")
        
        # Tipos de notificação:
        # 1 = SUBSCRIPTION_RECOVERED - Recuperada após problema de pagamento
        # 2 = SUBSCRIPTION_RENEWED - Renovada com sucesso
        # 3 = SUBSCRIPTION_CANCELED - Cancelada pelo usuário
        # 4 = SUBSCRIPTION_PURCHASED - Nova compra
        # 5 = SUBSCRIPTION_ON_HOLD - Em espera por problema de pagamento
        # 6 = SUBSCRIPTION_IN_GRACE_PERIOD - Período de carência após problema
        # 7 = SUBSCRIPTION_RESTARTED - Reiniciada
        # 8 = SUBSCRIPTION_PRICE_CHANGE_CONFIRMED - Mudança de preço confirmada
        # 9 = SUBSCRIPTION_DEFERRED - Adiada
        # 10 = SUBSCRIPTION_PAUSED - Pausada
        # 11 = SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED - Agendamento de pausa mudado
        # 12 = SUBSCRIPTION_REVOKED - Revogada
        # 13 = SUBSCRIPTION_EXPIRED - Expirada
        
        # Buscar usuário pelo purchase_token
        user = await db.users.find_one({"google_play_purchase_token": purchase_token})
        
        if not user:
            logging.error(f"[GOOGLE_PLAY_WEBHOOK] User not found for token: {purchase_token[:20]}...")
            return {"status": "error", "message": "User not found"}
        
        logging.info(f"[GOOGLE_PLAY_WEBHOOK] Found user: {user['email']} ({user['id']})")
        
        # Buscar informações atualizadas da subscription no Google Play
        subscription_info = None
        if GOOGLE_PLAY_SERVICE_ACCOUNT_FILE and os.path.exists(GOOGLE_PLAY_SERVICE_ACCOUNT_FILE):
            try:
                credentials = service_account.Credentials.from_service_account_file(
                    GOOGLE_PLAY_SERVICE_ACCOUNT_FILE,
                    scopes=['https://www.googleapis.com/auth/androidpublisher']
                )
                
                service = build('androidpublisher', 'v3', credentials=credentials)
                
                result = service.purchases().subscriptions().get(
                    packageName=GOOGLE_PACKAGE_NAME,
                    subscriptionId=subscription_id,
                    token=purchase_token
                ).execute()
                
                subscription_info = result
                logging.info(f"[GOOGLE_PLAY_WEBHOOK] Fetched subscription info from Google Play API")
                
            except Exception as e:
                logging.error(f"[GOOGLE_PLAY_WEBHOOK] Error fetching subscription info: {str(e)}")
        
        # Processar cada tipo de notificação
        update_data = {}
        
        if notification_type in [1, 2]:  # RECOVERED ou RENEWED
            logging.info(f"[GOOGLE_PLAY_WEBHOOK] ✅ Subscription renewed/recovered")
            
            # Renovar a assinatura
            if subscription_info:
                expiry_millis = int(subscription_info.get('expiryTimeMillis', 0))
                expiration_date = datetime.fromtimestamp(expiry_millis / 1000.0)
                
                update_data = {
                    "plano_ativo": subscription_id,
                    "data_expiracao_plano": expiration_date,
                    "google_play_expiry_time": expiration_date,
                    "google_play_auto_renewing": subscription_info.get('autoRenewing', True),
                    "google_play_payment_state": subscription_info.get('paymentState', 1),
                }
                
                logging.info(f"[GOOGLE_PLAY_WEBHOOK] New expiration: {expiration_date.strftime('%d/%m/%Y %H:%M')}")
            
        elif notification_type == 3:  # CANCELED
            logging.info(f"[GOOGLE_PLAY_WEBHOOK] ⚠️ Subscription canceled by user")
            update_data = {
                "google_play_auto_renewing": False,
            }
            # Não desativar imediatamente - usuário tem acesso até expirar
            
        elif notification_type in [5, 6]:  # ON_HOLD ou GRACE_PERIOD
            logging.info(f"[GOOGLE_PLAY_WEBHOOK] ⚠️ Subscription in grace period/on hold")
            # Manter ativo durante período de carência
            
        elif notification_type == 12:  # REVOKED
            logging.info(f"[GOOGLE_PLAY_WEBHOOK] ❌ Subscription revoked (refund/chargeback)")
            update_data = {
                "plano_ativo": "free",
                "google_play_auto_renewing": False,
                "data_expiracao_plano": datetime.utcnow(),
            }
            
        elif notification_type == 13:  # EXPIRED
            logging.info(f"[GOOGLE_PLAY_WEBHOOK] ⏰ Subscription expired")
            update_data = {
                "plano_ativo": "free",
                "google_play_auto_renewing": False,
            }
        
        # Atualizar banco de dados se houver mudanças
        if update_data:
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": update_data}
            )
            logging.info(f"[GOOGLE_PLAY_WEBHOOK] ✅ User updated: {json.dumps(update_data, default=str, indent=2)}")
        
        return {"status": "ok", "processed": True}
        
    except Exception as e:
        logging.error(f"[GOOGLE_PLAY_WEBHOOK] ❌ Error processing webhook: {str(e)}")
        logging.error(f"[GOOGLE_PLAY_WEBHOOK] Full traceback: {traceback.format_exc()}")
        # Retornar 200 mesmo com erro para não reenviar
        return {"status": "error", "message": str(e)}



@api_router.post("/criar-assinatura")
async def criar_assinatura(
    request: CreateSubscriptionRequest,
    current_user=Depends(security)
):
    try:
        user = await get_current_user(current_user)
        
        # Get plan from database
        plano = await db.plans.find_one({"id": request.plano, "active": True})
        
        if not plano:
            raise HTTPException(status_code=400, detail="Plano inválido ou inativo")
        
        plano_info = {
            "price": plano["price"],
            "name": plano["name"],
            "interval": plano["interval"],
            "interval_count": plano.get("interval_count", 1)
        }
        
        # Create or retrieve Stripe customer
        stripe_customer_id = user.get("stripe_customer_id")
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user["email"],
                name=user["nome"],
                metadata={"user_id": user["id"], "plano": request.plano}
            )
            stripe_customer_id = customer.id
            
            # Save customer ID
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
        # Create or retrieve product and price
        try:
            # Try to find existing price
            prices = stripe.Price.list(
                active=True,
                currency='brl',
                limit=100
            )
            
            price_id = None
            for price in prices.data:
                if (price.get('unit_amount') == plano_info["price"] and 
                    price.get('recurring', {}).get('interval') == plano_info["interval"]):
                    price_id = price.id
                    break
            
            if not price_id:
                # Create new price
                price = stripe.Price.create(
                    unit_amount=plano_info["price"],
                    currency="brl",
                    recurring={
                        "interval": plano_info["interval"],
                        "interval_count": plano_info.get("interval_count", 1)
                    },
                    product_data={"name": plano_info["name"]}
                )
                price_id = price.id
                logging.info(f"Created new price: {price_id}")
        except Exception as e:
            logging.error(f"Error finding/creating price: {str(e)}")
            # Create new price as fallback
            price = stripe.Price.create(
                unit_amount=plano_info["price"],
                currency="brl",
                recurring={
                    "interval": plano_info["interval"],
                    "interval_count": plano_info.get("interval_count", 1)
                },
                product_data={"name": plano_info["name"]}
            )
            price_id = price.id
        
        # Create a Subscription with the first payment
        # This enables automatic recurring billing
        logging.info(f"Creating subscription for customer {stripe_customer_id} with price {price_id}")
        
        subscription = stripe.Subscription.create(
            customer=stripe_customer_id,
            items=[{'price': price_id}],
            payment_behavior='default_incomplete',
            payment_settings={
                'save_default_payment_method': 'on_subscription',
                'payment_method_types': ['card']
            },
            metadata={
                "user_id": user["id"],
                "plano": request.plano,
            }
        )
        
        logging.info(f"Subscription created: {subscription.id}, status: {subscription.status}")
        
        # Retrieve the subscription with expanded invoice and payment_intent
        # This is more reliable than relying on the create response
        subscription_expanded = stripe.Subscription.retrieve(
            subscription.id,
            expand=['latest_invoice.payment_intent']
        )
        
        # Get the PaymentIntent from the subscription's first invoice
        latest_invoice = subscription_expanded.latest_invoice
        
        logging.info(f"Latest invoice: {latest_invoice.id if hasattr(latest_invoice, 'id') else latest_invoice}")
        
        # Extract payment_intent
        payment_intent = None
        if hasattr(latest_invoice, 'payment_intent'):
            payment_intent = latest_invoice.payment_intent
        elif isinstance(latest_invoice, dict):
            payment_intent = latest_invoice.get('payment_intent')
        
        logging.info(f"Payment intent: {payment_intent}")
        
        # If no payment_intent exists, fetch the invoice and check
        if not payment_intent:
            invoice_id = latest_invoice.id if hasattr(latest_invoice, 'id') else latest_invoice
            logging.info(f"No payment_intent found, fetching invoice separately: {invoice_id}")
            
            invoice = stripe.Invoice.retrieve(invoice_id)
            invoice_payment_intent = getattr(invoice, 'payment_intent', None)
            logging.info(f"Invoice status: {invoice.status}, payment_intent: {invoice_payment_intent}")
            
            # If invoice has no payment_intent, handle based on status
            if not invoice_payment_intent:
                if invoice.status == 'draft':
                    logging.info("Invoice is draft, finalizing to create payment_intent...")
                    invoice = stripe.Invoice.finalize_invoice(invoice_id)
                    invoice_payment_intent = getattr(invoice, 'payment_intent', None)
                    logging.info(f"Invoice finalized, payment_intent: {invoice_payment_intent}")
                
                elif invoice.status == 'open':
                    # Invoice is open but has no payment_intent
                    # This can happen with collection_method='send_invoice'
                    # We need to create a PaymentIntent manually
                    logging.info("Invoice is open but has no payment_intent, creating manually...")
                    
                    # Create PaymentIntent for the invoice
                    manual_payment_intent = stripe.PaymentIntent.create(
                        amount=invoice.amount_due,
                        currency=invoice.currency,
                        customer=invoice.customer,
                        metadata={
                            'invoice_id': invoice.id,
                            'subscription_id': subscription.id,
                        },
                        automatic_payment_methods={'enabled': True},
                    )
                    
                    logging.info(f"Manual PaymentIntent created: {manual_payment_intent.id}")
                    invoice_payment_intent = manual_payment_intent.id
            
            payment_intent = invoice_payment_intent
        
        # Handle payment_intent as string or object
        if isinstance(payment_intent, str):
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent)
        
        if not payment_intent:
            raise ValueError(f"Could not retrieve payment_intent from subscription. Invoice status: {invoice.status if 'invoice' in locals() else 'unknown'}")
        
        # Extract id and client_secret safely
        payment_intent_id = payment_intent.id if hasattr(payment_intent, 'id') else payment_intent.get('id')
        client_secret = payment_intent.client_secret if hasattr(payment_intent, 'client_secret') else payment_intent.get('client_secret')
        
        # Save subscription info
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "stripe_subscription_id": subscription.id,
                "stripe_payment_intent_id": payment_intent_id,
                "stripe_pending_plan": request.plano,
                "stripe_pending_price_id": price_id
            }}
        )
        
        logging.info(f"Subscription created for user {user['id']}: {subscription.id}, PaymentIntent: {payment_intent_id}")
        
        return {
            "payment_intent_id": payment_intent_id,
            "client_secret": client_secret,
            "publishable_key": os.environ.get('STRIPE_PUBLISHABLE_KEY'),
            "customer_id": stripe_customer_id,
            "subscription_id": subscription.id,
            "plano": request.plano,
            "valor": plano_info["price"] / 100  # Convert to reais
        }
        
    except Exception as e:
        logging.error(f"Error creating subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar assinatura: {str(e)}")

@api_router.post("/cancelar-assinatura")
async def cancelar_assinatura(current_user=Depends(security)):
    """
    Cancela a assinatura ativa do usuário
    """
    try:
        user = await get_current_user(current_user)
        
        logging.info(f"[CANCEL] Starting subscription cancellation for user {user['id']}")
        
        # Verificar se usuário tem assinatura ativa
        if not user.get('stripe_subscription_id'):
            raise HTTPException(status_code=400, detail="Usuário não possui assinatura ativa")
        
        subscription_id = user['stripe_subscription_id']
        
        # Cancelar subscription no Stripe
        # cancel_at_period_end=True mantém o acesso até o fim do período pago
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            logging.info(f"[CANCEL] Subscription {subscription_id} marked for cancellation at period end")
            
            # Atualizar banco de dados para refletir cancelamento pendente
            await db.users.update_one(
                {"id": user["id"]},
                {
                    "$set": {
                        "subscription_cancel_at_period_end": True,
                        "subscription_canceled_at": datetime.utcnow()
                    }
                }
            )
            
            # Extrair valores de forma segura
            cancel_at = getattr(subscription, 'cancel_at', None)
            current_period_end = getattr(subscription, 'current_period_end', None)
            
            logging.info(f"[CANCEL] User {user['email']} subscription will cancel at {cancel_at}")
            
            return {
                "success": True,
                "message": "Assinatura cancelada com sucesso",
                "cancel_at": cancel_at,
                "current_period_end": current_period_end,
                "details": "Você continuará tendo acesso premium até o fim do período pago"
            }
            
        except Exception as stripe_error:
            # Capturar qualquer erro do Stripe
            if 'Stripe' in str(type(stripe_error)):
                logging.error(f"[CANCEL] Stripe error: {str(stripe_error)}")
                raise HTTPException(status_code=400, detail=f"Erro ao cancelar no Stripe: {str(stripe_error)}")
            else:
                raise
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[CANCEL] Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar assinatura: {str(e)}")

@api_router.post("/reativar-assinatura")
async def reativar_assinatura(current_user=Depends(security)):
    """
    Reativa uma assinatura que foi marcada para cancelamento
    """
    try:
        user = await get_current_user(current_user)
        
        logging.info(f"[REACTIVATE] Starting subscription reactivation for user {user['id']}")
        
        # Verificar se usuário tem assinatura
        if not user.get('stripe_subscription_id'):
            raise HTTPException(status_code=400, detail="Usuário não possui assinatura")
        
        subscription_id = user['stripe_subscription_id']
        
        # Reativar subscription no Stripe
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            logging.info(f"[REACTIVATE] Subscription {subscription_id} reactivated")
            
            # Atualizar banco de dados
            await db.users.update_one(
                {"id": user["id"]},
                {
                    "$set": {
                        "subscription_cancel_at_period_end": False
                    },
                    "$unset": {
                        "subscription_canceled_at": ""
                    }
                }
            )
            
            logging.info(f"[REACTIVATE] User {user['email']} subscription reactivated")
            
            return {
                "success": True,
                "message": "Assinatura reativada com sucesso",
                "details": "Sua assinatura continuará renovando automaticamente"
            }
            
        except Exception as stripe_error:
            # Capturar qualquer erro do Stripe
            if 'Stripe' in str(type(stripe_error)):
                logging.error(f"[REACTIVATE] Stripe error: {str(stripe_error)}")
                raise HTTPException(status_code=400, detail=f"Erro ao reativar no Stripe: {str(stripe_error)}")
            else:
                raise
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[REACTIVATE] Error reactivating subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao reativar assinatura: {str(e)}")

@api_router.post("/confirmar-pagamento")
async def confirmar_pagamento(
    payment_intent_id: str = Form(...),
    current_user=Depends(security)
):
    try:
        user = await get_current_user(current_user)
        logging.info(f"[CONFIRM] Starting payment confirmation for user {user['id']}, payment_intent: {payment_intent_id}")
        
        # Retrieve payment intent from Stripe
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            logging.info(f"[CONFIRM] Payment intent retrieved - Status: {payment_intent.status}, Amount: {payment_intent.amount}")
            logging.info(f"[CONFIRM] Payment method: {payment_intent.payment_method}")
        except Exception as stripe_error:
            logging.error(f"[CONFIRM] ❌ Error retrieving payment intent from Stripe: {str(stripe_error)}")
            raise HTTPException(status_code=400, detail=f"Não foi possível verificar o pagamento no Stripe: {str(stripe_error)}")
        
        if payment_intent.status == "succeeded":
            # Get pending plan info
            plano_tipo = user.get("stripe_pending_plan")
            price_id = user.get("stripe_pending_price_id")
            
            logging.info(f"[CONFIRM] User plan info - Plan type: {plano_tipo}, Price ID: {price_id}")
            
            if not plano_tipo:
                logging.error(f"[CONFIRM] ❌ Missing plan type for user {user['id']}")
                raise HTTPException(status_code=400, detail="Informações do plano não encontradas. Por favor, tente assinar novamente.")
            
            # Get plan details from database
            plan = await db.plans.find_one({"id": plano_tipo})
            if not plan:
                logging.error(f"[CONFIRM] ❌ Plan {plano_tipo} not found in database")
                raise HTTPException(status_code=400, detail="Plano não encontrado no sistema")
            
            logging.info(f"[CONFIRM] Plan found: {plan['name']} - R$ {plan['price']/100:.2f}")
            
            # Calculate expiration date based on plan interval
            if plan["interval"] == "month":
                days_to_add = 30 * plan.get("interval_count", 1)
            elif plan["interval"] == "year":
                days_to_add = 365 * plan.get("interval_count", 1)
            else:
                days_to_add = 30  # Default to monthly
            
            expiration_date = datetime.utcnow() + timedelta(days=days_to_add)
            
            logging.info(f"[CONFIRM] Calculated expiration date: {expiration_date}")
            
            # Update user subscription info (simplified - no Stripe subscription creation)
            update_result = await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "plano_ativo": plano_tipo,
                    "stripe_payment_intent_id": payment_intent_id,
                    "data_expiracao_plano": expiration_date,
                    "looks_usados": 0  # Reset counter for premium users
                }, "$unset": {
                    "stripe_pending_plan": "",
                    "stripe_pending_price_id": ""
                }}
            )
            
            if update_result.modified_count == 0:
                logging.warning(f"[CONFIRM] ⚠️  No document updated for user {user['id']} - maybe already activated?")
            else:
                logging.info("[CONFIRM] ✅ User document updated successfully")
            
            logging.info(f"[CONFIRM] ✅✅✅ Payment confirmed and plan activated for user {user['id']}: {plano_tipo}, expires: {expiration_date.strftime('%d/%m/%Y')}")
            
            return {
                "message": "Pagamento confirmado! Assinatura ativada com sucesso!",
                "plano": plano_tipo,
                "plano_nome": plan["name"],
                "expira_em": expiration_date.isoformat(),
                "status": "active"
            }
        else:
            logging.warning(f"[CONFIRM] ⚠️  Payment intent {payment_intent_id} status is '{payment_intent.status}', expected 'succeeded'")
            return {
                "message": f"Pagamento ainda em processamento (status: {payment_intent.status})",
                "status": payment_intent.status
            }
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"[CONFIRM] ❌❌❌ Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao confirmar pagamento: {str(e)}")

@api_router.get("/status-assinatura")
async def status_assinatura(current_user=Depends(security)):
    user = await get_current_user(current_user)
    
    plano_ativo = user.get("plano_ativo", "free")
    looks_usados = user.get("looks_usados", 0)
    data_expiracao = user.get("data_expiracao_plano")
    
    # Check if plan has expired
    plan_expired = False
    if plano_ativo != "free" and data_expiracao:
        if data_expiracao < datetime.utcnow():
            plan_expired = True
            # Reset to free plan
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"plano_ativo": "free", "data_expiracao_plano": None}}
            )
            plano_ativo = "free"
    
    # Get plan details if active
    plan_details = None
    if plano_ativo != "free":
        plan = await db.plans.find_one({"id": plano_ativo}, {"_id": 0})
        if plan:
            plan_details = {
                "name": plan["name"],
                "badge": plan.get("badge"),
                "color": plan.get("color", "#FFD700")
            }
    
    return {
        "plano_ativo": plano_ativo,
        "plan_details": plan_details,
        "is_premium": plano_ativo != "free",
        "looks_usados": looks_usados,
        "looks_restantes": max(0, 5 - looks_usados) if plano_ativo == "free" else "ilimitado",
        "data_expiracao": data_expiracao.isoformat() if data_expiracao else None,
        "plan_expired": plan_expired
    }

@api_router.get("/planos")
async def get_planos():
    """Retorna todos os planos ativos"""
    plans = await db.plans.find({"active": True}, {"_id": 0}).to_list(100)
    return plans

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Meu Look IA API"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint para monitoramento"""
    try:
        # Testar conexão com MongoDB
        await db.command("ping")
        
        return {
            "status": "healthy",
            "service": "Meu Look IA API",
            "version": "1.0.0",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Meu Look IA API",
            "version": "1.0.0",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@api_router.get("/status")
async def status():
    """Status detalhado do sistema"""
    try:
        # Contadores de documentos
        users_count = await db.users.count_documents({})
        roupas_count = await db.clothing_items.count_documents({})
        looks_count = await db.looks.count_documents({})
        suggestions_count = await db.suggestions.count_documents({})
        
        # Testar MongoDB
        db_status = "connected"
        try:
            await db.command("ping")
        except:
            db_status = "disconnected"
        
        return {
            "status": "online",
            "service": "Meu Look IA API",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "status": db_status,
                "name": os.environ.get('DB_NAME', 'unknown')
            },
            "statistics": {
                "users": users_count,
                "clothing_items": roupas_count,
                "looks": looks_count,
                "suggestions": suggestions_count
            },
            "features": {
                "openai": bool(os.environ.get('OPENAI_API_KEY')),
                "stripe": bool(os.environ.get('STRIPE_SECRET_KEY')),
                "sendgrid": bool(os.environ.get('SENDGRID_API_KEY')),
                "fal_ai": bool(os.environ.get('FAL_API_KEY'))
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@api_router.post("/sugestoes")
async def criar_sugestao(
    suggestion: SuggestionCreate,
    current_user=Depends(security)
):
    """Endpoint para usuário enviar sugestões de melhorias"""
    try:
        user = await get_current_user(current_user)
        
        # Criar objeto de sugestão
        suggestion_data = Suggestion(
            user_id=user["id"],
            user_email=user["email"],
            mensagem=suggestion.mensagem
        )
        
        # Salvar no banco
        await db.suggestions.insert_one(suggestion_data.dict())
        
        # Enviar email para contato@meulookia.com.br
        try:
            email_body = f"""
            <h2>Nova Sugestão Recebida - Meu Look IA</h2>
            <p><strong>De:</strong> {user['email']}</p>
            <p><strong>Nome:</strong> {user['nome']}</p>
            <p><strong>Data:</strong> {suggestion_data.created_at.strftime('%d/%m/%Y %H:%M')}</p>
            <hr>
            <h3>Mensagem:</h3>
            <p>{suggestion.mensagem}</p>
            """
            
            email_service._send_email(
                to_email="contato@meulookia.com.br",
                subject=f"Nova Sugestão de Melhoria - {user['nome']}",
                html_content=email_body
            )
        except Exception as email_error:
            logging.error(f"Erro ao enviar email de sugestão: {email_error}")
            # Não falhar se o email não for enviado
        
        return {
            "success": True,
            "message": "Sugestão enviada com sucesso! Obrigado pelo feedback.",
            "suggestion_id": suggestion_data.id
        }
    
    except Exception as e:
        logging.error(f"Erro ao criar sugestão: {e}")
        raise HTTPException(status_code=500, detail="Erro ao enviar sugestão")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()