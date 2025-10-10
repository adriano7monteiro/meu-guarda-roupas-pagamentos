from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form, Depends
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
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret (in production, use a secure secret)
JWT_SECRET = "meu-look-ia-secret-key-2025"
security = HTTPBearer()

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
    imagem_sem_fundo: Optional[str] = None  # base64
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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LookCreate(BaseModel):
    nome: str
    roupas_ids: List[str]
    ocasiao: str
    clima: Optional[str] = None

class SugestaoLook(BaseModel):
    sugestao_texto: str
    roupas_sugeridas: List[str]
    ocasiao: str
    clima: str

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

# Clothing routes
@api_router.post("/upload-roupa")
async def upload_roupa(
    roupa_data: ClothingItemCreate,
    current_user=Depends(security)
):
    user = await get_current_user(current_user)
    
    # Create clothing item
    clothing_dict = roupa_data.dict()
    clothing_dict["user_id"] = user["id"]
    clothing_dict["imagem_sem_fundo"] = roupa_data.imagem_original  # Por enquanto, sem remoção de fundo
    
    clothing = ClothingItem(**clothing_dict)
    await db.clothing_items.insert_one(clothing.dict())
    
    return {"message": "Roupa cadastrada com sucesso", "id": clothing.id}

@api_router.get("/roupas")
async def get_roupas(current_user=Depends(security)):
    user = await get_current_user(current_user)
    
    roupas = await db.clothing_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return roupas

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
    
    # Create AI prompt
    prompt = f"""
    Como personal stylist virtual, sugira uma combinação de roupas para o usuário.
    
    Ocasião: {ocasiao}
    Temperatura: {temperatura or "não informada"}
    
    Roupas disponíveis:
    {json.dumps(roupas_context, indent=2, ensure_ascii=False)}
    
    Responda em JSON com:
    {{
        "sugestao_texto": "Explicação da combinação sugerida",
        "roupas_ids": ["id1", "id2", "id3"],
        "dicas": "Dicas de estilo para a ocasião"
    }}
    
    Escolha peças que combinem bem entre si e sejam adequadas para a ocasião.
    """
    
    try:
        # Initialize AI chat
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"look-suggestion-{user['id']}-{datetime.utcnow().isoformat()}",
            system_message="Você é um personal stylist virtual especializado em combinações de roupas."
        ).with_model("openai", "gpt-4o-mini")
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        try:
            ai_response = json.loads(response)
            return {
                "sugestao_texto": ai_response.get("sugestao_texto", ""),
                "roupas_ids": ai_response.get("roupas_ids", []),
                "dicas": ai_response.get("dicas", ""),
                "ocasiao": ocasiao,
                "temperatura": temperatura
            }
        except json.JSONDecodeError:
            return {
                "sugestao_texto": response,
                "roupas_ids": [roupa["id"] for roupa in roupas[:3]],  # Fallback
                "dicas": "Consulte um personal stylist para dicas mais específicas.",
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
    
    # Validate that all clothing items exist and belong to user
    for roupa_id in look_data.roupas_ids:
        roupa = await db.clothing_items.find_one({
            "id": roupa_id,
            "user_id": user["id"]
        })
        if not roupa:
            raise HTTPException(status_code=400, detail=f"Roupa {roupa_id} não encontrada")
    
    # Create look
    look_dict = look_data.dict()
    look_dict["user_id"] = user["id"]
    
    look = Look(**look_dict)
    await db.looks.insert_one(look.dict())
    
    return {"message": "Look salvo com sucesso", "id": look.id}

@api_router.get("/looks")
async def get_looks(current_user=Depends(security)):
    user = await get_current_user(current_user)
    
    looks = await db.looks.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return looks

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

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Meu Look IA API"}

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