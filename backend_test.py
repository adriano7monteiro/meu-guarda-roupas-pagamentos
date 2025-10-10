#!/usr/bin/env python3
"""
Backend Test Suite for Meu Look IA
Tests all backend API endpoints systematically
"""

import requests
import json
import base64
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path("/app/frontend/.env"))

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def success(self, test_name):
        print(f"✅ {test_name}")
        self.passed += 1
        
    def failure(self, test_name, error):
        print(f"❌ {test_name}: {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"TEST SUMMARY: {self.passed}/{total} passed")
        if self.errors:
            print(f"\nFAILURES:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*50}")

# Global test state
results = TestResults()
auth_token = None
user_data = None
test_roupa_id = None
test_look_id = None

def test_basic_connection():
    """Test basic API connection"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "Meu Look IA API" in data.get("message", ""):
                results.success("Basic API Connection")
                return True
            else:
                results.failure("Basic API Connection", f"Unexpected response: {data}")
        else:
            results.failure("Basic API Connection", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Basic API Connection", f"Connection error: {str(e)}")
    return False

def test_user_registration():
    """Test user registration"""
    global auth_token, user_data
    
    test_user = {
        "email": "maria.silva@teste.com",
        "password": "MinhaSenh@123",
        "nome": "Maria Silva",
        "ocasiao_preferida": "trabalho"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=test_user, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                auth_token = data["token"]
                user_data = data["user"]
                results.success("User Registration")
                return True
            else:
                results.failure("User Registration", f"Missing token or user in response: {data}")
        else:
            results.failure("User Registration", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("User Registration", f"Request error: {str(e)}")
    return False

def test_user_login():
    """Test user login with existing user"""
    global auth_token, user_data
    
    login_data = {
        "email": "maria.silva@teste.com",
        "password": "MinhaSenh@123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                auth_token = data["token"]  # Update token
                user_data = data["user"]
                results.success("User Login")
                return True
            else:
                results.failure("User Login", f"Missing token or user in response: {data}")
        else:
            results.failure("User Login", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("User Login", f"Request error: {str(e)}")
    return False

def test_get_user_profile():
    """Test getting user profile with JWT token"""
    if not auth_token:
        results.failure("Get User Profile", "No auth token available")
        return False
        
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "email" in data and "nome" in data:
                results.success("Get User Profile")
                return True
            else:
                results.failure("Get User Profile", f"Missing user data in response: {data}")
        else:
            results.failure("Get User Profile", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get User Profile", f"Request error: {str(e)}")
    return False

def test_upload_roupa():
    """Test uploading a clothing item"""
    global test_roupa_id
    
    if not auth_token:
        results.failure("Upload Roupa", "No auth token available")
        return False
    
    # Create a simple base64 image (1x1 pixel PNG)
    simple_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    roupa_data = {
        "tipo": "camiseta",
        "cor": "azul",
        "estilo": "casual",
        "nome": "Camiseta Azul Casual",
        "imagem_original": simple_image_b64
    }
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.post(f"{API_BASE}/upload-roupa", json=roupa_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "message" in data:
                test_roupa_id = data["id"]
                results.success("Upload Roupa")
                return True
            else:
                results.failure("Upload Roupa", f"Missing id or message in response: {data}")
        else:
            results.failure("Upload Roupa", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Upload Roupa", f"Request error: {str(e)}")
    return False

def test_get_roupas():
    """Test getting user's clothing items"""
    if not auth_token:
        results.failure("Get Roupas", "No auth token available")
        return False
        
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{API_BASE}/roupas", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                results.success("Get Roupas")
                return True
            else:
                results.failure("Get Roupas", f"Expected list, got: {type(data)}")
        else:
            results.failure("Get Roupas", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get Roupas", f"Request error: {str(e)}")
    return False

def test_sugerir_look():
    """Test AI look suggestion"""
    if not auth_token:
        results.failure("Sugerir Look", "No auth token available")
        return False
        
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Use form data as the endpoint expects Form parameters
    form_data = {
        "ocasiao": "trabalho",
        "temperatura": "amena"
    }
    
    try:
        response = requests.post(f"{API_BASE}/sugerir-look", data=form_data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if "sugestao_texto" in data and "ocasiao" in data:
                results.success("Sugerir Look")
                return True
            else:
                results.failure("Sugerir Look", f"Missing required fields in response: {data}")
        else:
            results.failure("Sugerir Look", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Sugerir Look", f"Request error: {str(e)}")
    return False

def test_create_look():
    """Test creating a saved look"""
    global test_look_id
    
    if not auth_token:
        results.failure("Create Look", "No auth token available")
        return False
        
    if not test_roupa_id:
        results.failure("Create Look", "No test roupa available")
        return False
    
    look_data = {
        "nome": "Look Trabalho Casual",
        "roupas_ids": [test_roupa_id],
        "ocasiao": "trabalho",
        "clima": "ameno"
    }
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.post(f"{API_BASE}/looks", json=look_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "message" in data:
                test_look_id = data["id"]
                results.success("Create Look")
                return True
            else:
                results.failure("Create Look", f"Missing id or message in response: {data}")
        else:
            results.failure("Create Look", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Create Look", f"Request error: {str(e)}")
    return False

def test_get_looks():
    """Test getting user's saved looks"""
    if not auth_token:
        results.failure("Get Looks", "No auth token available")
        return False
        
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{API_BASE}/looks", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                results.success("Get Looks")
                return True
            else:
                results.failure("Get Looks", f"Expected list, got: {type(data)}")
        else:
            results.failure("Get Looks", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get Looks", f"Request error: {str(e)}")
    return False

def test_favorite_look():
    """Test favoriting a look"""
    if not auth_token:
        results.failure("Favorite Look", "No auth token available")
        return False
        
    if not test_look_id:
        results.failure("Favorite Look", "No test look available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.post(f"{API_BASE}/looks/{test_look_id}/favoritar", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                results.success("Favorite Look")
                return True
            else:
                results.failure("Favorite Look", f"Missing message in response: {data}")
        else:
            results.failure("Favorite Look", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Favorite Look", f"Request error: {str(e)}")
    return False

def test_delete_look():
    """Test deleting a look"""
    if not auth_token:
        results.failure("Delete Look", "No auth token available")
        return False
        
    if not test_look_id:
        results.failure("Delete Look", "No test look available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.delete(f"{API_BASE}/looks/{test_look_id}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                results.success("Delete Look")
                return True
            else:
                results.failure("Delete Look", f"Missing message in response: {data}")
        else:
            results.failure("Delete Look", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Delete Look", f"Request error: {str(e)}")
    return False

def test_delete_roupa():
    """Test deleting a clothing item"""
    if not auth_token:
        results.failure("Delete Roupa", "No auth token available")
        return False
        
    if not test_roupa_id:
        results.failure("Delete Roupa", "No test roupa available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.delete(f"{API_BASE}/roupas/{test_roupa_id}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                results.success("Delete Roupa")
                return True
            else:
                results.failure("Delete Roupa", f"Missing message in response: {data}")
        else:
            results.failure("Delete Roupa", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Delete Roupa", f"Request error: {str(e)}")
    return False

def run_all_tests():
    """Run all backend tests in sequence"""
    print("🚀 Starting Meu Look IA Backend Tests")
    print(f"Backend URL: {API_BASE}")
    print("="*50)
    
    # Test basic connection first
    if not test_basic_connection():
        print("❌ Cannot connect to backend. Stopping tests.")
        return
    
    # Authentication tests
    print("\n📝 Testing Authentication...")
    test_user_registration()
    test_user_login()
    test_get_user_profile()
    
    # Clothing management tests
    print("\n👕 Testing Clothing Management...")
    test_upload_roupa()
    test_get_roupas()
    
    # AI suggestion tests
    print("\n🤖 Testing AI Look Suggestions...")
    test_sugerir_look()
    
    # Look management tests
    print("\n💫 Testing Look Management...")
    test_create_look()
    test_get_looks()
    test_favorite_look()
    
    # Cleanup tests
    print("\n🧹 Testing Cleanup Operations...")
    test_delete_look()
    test_delete_roupa()
    
    # Show final results
    results.summary()

if __name__ == "__main__":
    run_all_tests()