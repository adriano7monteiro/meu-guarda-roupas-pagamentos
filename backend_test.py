#!/usr/bin/env python3
"""
Backend Test Suite for Meu Look IA
Comprehensive backend testing after environment variable refactoring
"""

import requests
import json
import base64
import os
from datetime import datetime
import sys
import time

# Configuration - Using the production backend URL from frontend config
BACKEND_URL = "https://meulookia-e68fc7ce1afa.herokuapp.com/api"

# Test data
TEST_USER = {
    "email": f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
    "password": "TestPassword123!",
    "nome": "Test User Upload Roupa",
    "ocasiao_preferida": "casual"
}

# Sample base64 image (small PNG)
SAMPLE_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

TEST_CLOTHING = {
    "tipo": "camiseta",
    "cor": "azul",
    "estilo": "casual",
    "nome": "Camiseta Azul Teste",
    "imagem_original": SAMPLE_IMAGE_BASE64
}

class TestResults:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
    
    def add_result(self, test_name, passed, message=""):
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.tests_failed += 1
            self.failures.append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED - {message}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_failed}")
        
        if self.failures:
            print(f"\nFAILURES:")
            for failure in self.failures:
                print(f"  - {failure}")
        
        return self.tests_failed == 0

def test_user_registration_and_login():
    """Test user registration and login to get auth token"""
    results = TestResults()
    
    print(f"\n🔐 Testing User Registration and Login")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Test registration
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=TEST_USER, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            user_info = data.get("user")
            
            if token and user_info:
                results.add_result("User Registration", True)
                print(f"   User created: {user_info.get('email')}")
                return token, results
            else:
                results.add_result("User Registration", False, "Missing token or user info in response")
                return None, results
        else:
            results.add_result("User Registration", False, f"HTTP {response.status_code}: {response.text}")
            return None, results
            
    except Exception as e:
        results.add_result("User Registration", False, f"Exception: {str(e)}")
        return None, results

def test_upload_roupa_endpoint(token):
    """Test POST /api/upload-roupa endpoint"""
    results = TestResults()
    
    print(f"\n👕 Testing POST /api/upload-roupa Endpoint")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/upload-roupa", json=TEST_CLOTHING, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            clothing_id = data.get("id")
            message = data.get("message")
            
            if clothing_id and message:
                results.add_result("Upload Roupa - Success Response", True)
                print(f"   Clothing ID: {clothing_id}")
                print(f"   Message: {message}")
                return clothing_id, results
            else:
                results.add_result("Upload Roupa - Success Response", False, "Missing id or message in response")
                return None, results
        else:
            results.add_result("Upload Roupa - Success Response", False, f"HTTP {response.status_code}: {response.text}")
            return None, results
            
    except Exception as e:
        results.add_result("Upload Roupa - Success Response", False, f"Exception: {str(e)}")
        return None, results

def test_get_roupas_endpoint(token, expected_clothing_id):
    """Test GET /api/roupas endpoint and verify no imagem_sem_fundo field"""
    results = TestResults()
    
    print(f"\n👔 Testing GET /api/roupas Endpoint")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/roupas", headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            
            results.add_result("Get Roupas - Success Response", True)
            print(f"   Found {len(items)} clothing items")
            
            # Find our uploaded item
            uploaded_item = None
            for item in items:
                if item.get("id") == expected_clothing_id:
                    uploaded_item = item
                    break
            
            if uploaded_item:
                results.add_result("Get Roupas - Find Uploaded Item", True)
                print(f"   Found uploaded item: {uploaded_item.get('nome')}")
                
                # Check that imagem_sem_fundo field is NOT present
                if "imagem_sem_fundo" not in uploaded_item:
                    results.add_result("Get Roupas - No imagem_sem_fundo Field", True)
                    print(f"   ✅ Confirmed: 'imagem_sem_fundo' field is NOT present")
                else:
                    results.add_result("Get Roupas - No imagem_sem_fundo Field", False, "imagem_sem_fundo field found in response")
                    print(f"   ❌ ERROR: 'imagem_sem_fundo' field found: {uploaded_item.get('imagem_sem_fundo')}")
                
                # Verify expected fields are present
                expected_fields = ["id", "user_id", "tipo", "cor", "estilo", "imagem_original", "nome", "created_at"]
                missing_fields = []
                for field in expected_fields:
                    if field not in uploaded_item:
                        missing_fields.append(field)
                
                if not missing_fields:
                    results.add_result("Get Roupas - Expected Fields Present", True)
                    print(f"   ✅ All expected fields present: {expected_fields}")
                else:
                    results.add_result("Get Roupas - Expected Fields Present", False, f"Missing fields: {missing_fields}")
                
                # Print item structure for verification
                print(f"   Item structure: {list(uploaded_item.keys())}")
                
            else:
                results.add_result("Get Roupas - Find Uploaded Item", False, f"Uploaded item with ID {expected_clothing_id} not found")
            
            return results
        else:
            results.add_result("Get Roupas - Success Response", False, f"HTTP {response.status_code}: {response.text}")
            return results
            
    except Exception as e:
        results.add_result("Get Roupas - Success Response", False, f"Exception: {str(e)}")
        return results

def test_mongodb_direct_verification(expected_clothing_id):
    """Test direct MongoDB verification for the specific item we just created"""
    results = TestResults()
    
    print(f"\n🗄️  Testing MongoDB Direct Verification")
    
    try:
        # Try to connect to MongoDB directly to verify document structure
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        async def check_mongodb():
            try:
                client = AsyncIOMotorClient("mongodb://localhost:27017")
                db = client["test_database"]
                
                # Get the specific item we just created
                specific_item = await db.clothing_items.find_one({"id": expected_clothing_id}, {"_id": 0})
                
                if specific_item:
                    if "imagem_sem_fundo" not in specific_item:
                        results.add_result("MongoDB - No imagem_sem_fundo in New Documents", True)
                        print(f"   ✅ Confirmed: New MongoDB document does NOT contain 'imagem_sem_fundo' field")
                        print(f"   Document fields: {list(specific_item.keys())}")
                    else:
                        results.add_result("MongoDB - No imagem_sem_fundo in New Documents", False, "imagem_sem_fundo field found in new MongoDB document")
                        print(f"   ❌ ERROR: 'imagem_sem_fundo' field found in new MongoDB document")
                else:
                    results.add_result("MongoDB - Document Check", False, f"Specific clothing item {expected_clothing_id} not found in database")
                
                # Also check if there are any old documents with the field (for information)
                old_items_count = await db.clothing_items.count_documents({"imagem_sem_fundo": {"$exists": True}})
                new_items_count = await db.clothing_items.count_documents({"imagem_sem_fundo": {"$exists": False}})
                
                print(f"   📊 Database statistics:")
                print(f"      - Items with imagem_sem_fundo field (old): {old_items_count}")
                print(f"      - Items without imagem_sem_fundo field (new): {new_items_count}")
                
                client.close()
                
            except Exception as e:
                results.add_result("MongoDB - Connection", False, f"MongoDB connection error: {str(e)}")
        
        # Run async function
        asyncio.run(check_mongodb())
        
    except ImportError:
        results.add_result("MongoDB - Direct Check", False, "motor library not available for direct MongoDB check")
        print(f"   ⚠️  Skipping direct MongoDB check (motor not available)")
    except Exception as e:
        results.add_result("MongoDB - Direct Check", False, f"Exception: {str(e)}")
    
    return results

def test_authentication_flow(token):
    """Test GET /api/auth/me endpoint"""
    results = TestResults()
    
    print(f"\n🔐 Testing GET /api/auth/me Endpoint")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["email", "nome", "ocasiao_preferida", "created_at"]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                results.add_result("Auth Me - Success Response", True)
                print(f"   User profile retrieved: {data.get('email')}")
            else:
                results.add_result("Auth Me - Success Response", False, f"Missing fields: {missing_fields}")
        else:
            results.add_result("Auth Me - Success Response", False, f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Auth Me - Success Response", False, f"Exception: {str(e)}")
    
    return results

def test_look_generation(token):
    """Test POST /api/sugerir-look endpoint"""
    results = TestResults()
    
    print(f"\n🤖 Testing POST /api/sugerir-look Endpoint")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    # First upload a clothing item for the AI to suggest
    clothing_data = {
        "tipo": "camiseta",
        "cor": "branca",
        "estilo": "casual",
        "nome": "Camiseta Branca Básica",
        "imagem_original": SAMPLE_IMAGE_BASE64
    }
    
    try:
        # Upload clothing first
        upload_response = requests.post(f"{BACKEND_URL}/upload-roupa", 
                                      json=clothing_data, 
                                      headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, 
                                      timeout=30)
        
        if upload_response.status_code != 200:
            results.add_result("Look Generation - Clothing Upload", False, f"Failed to upload clothing: {upload_response.status_code}")
            return results
        
        # Now test look suggestion
        suggestion_data = {
            "ocasiao": "trabalho",
            "temperatura": "ameno",
            "detalhes_contexto": "reunião importante"
        }
        
        response = requests.post(f"{BACKEND_URL}/sugerir-look", 
                               data=suggestion_data, 
                               headers=headers, 
                               timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["sugestao_texto", "roupas_ids", "ocasiao"]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                results.add_result("Look Generation - Success Response", True)
                print(f"   Suggestion generated: {len(data.get('sugestao_texto', ''))} chars")
                print(f"   Suggested clothes: {len(data.get('roupas_ids', []))} items")
            else:
                results.add_result("Look Generation - Success Response", False, f"Missing fields: {missing_fields}")
        else:
            results.add_result("Look Generation - Success Response", False, f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Look Generation - Success Response", False, f"Exception: {str(e)}")
    
    return results

def test_look_management(token):
    """Test look CRUD operations"""
    results = TestResults()
    
    print(f"\n👔 Testing Look Management Endpoints")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # First create a clothing item to use in the look
        clothing_data = {
            "tipo": "calca",
            "cor": "preta",
            "estilo": "social",
            "nome": "Calça Social Preta",
            "imagem_original": SAMPLE_IMAGE_BASE64
        }
        
        clothing_response = requests.post(f"{BACKEND_URL}/upload-roupa", 
                                        json=clothing_data, 
                                        headers=headers, 
                                        timeout=30)
        
        if clothing_response.status_code != 200:
            results.add_result("Look Management - Clothing Setup", False, "Failed to create clothing for look")
            return results
        
        clothing_id = clothing_response.json().get("id")
        
        # Test POST /api/looks (create look)
        look_data = {
            "nome": "Look Executivo",
            "roupas_ids": [clothing_id],
            "ocasiao": "trabalho",
            "clima": "ameno"
        }
        
        create_response = requests.post(f"{BACKEND_URL}/looks", 
                                      json=look_data, 
                                      headers=headers, 
                                      timeout=30)
        
        if create_response.status_code == 200:
            look_id = create_response.json().get("id")
            results.add_result("Look Management - Create Look", True)
            print(f"   Look created: {look_id}")
            
            # Test GET /api/looks (list looks)
            list_response = requests.get(f"{BACKEND_URL}/looks", headers=headers, timeout=30)
            
            if list_response.status_code == 200:
                looks_data = list_response.json()
                if "items" in looks_data and len(looks_data["items"]) > 0:
                    results.add_result("Look Management - List Looks", True)
                    print(f"   Found {len(looks_data['items'])} looks")
                else:
                    results.add_result("Look Management - List Looks", False, "No looks found in response")
            else:
                results.add_result("Look Management - List Looks", False, f"HTTP {list_response.status_code}")
            
            # Test POST /api/looks/{id}/favoritar (toggle favorite)
            favorite_response = requests.post(f"{BACKEND_URL}/looks/{look_id}/favoritar", 
                                            headers=headers, 
                                            timeout=30)
            
            if favorite_response.status_code == 200:
                results.add_result("Look Management - Toggle Favorite", True)
                print(f"   Look favorited successfully")
            else:
                results.add_result("Look Management - Toggle Favorite", False, f"HTTP {favorite_response.status_code}")
            
            # Test GET /api/looks/stats/favoritos
            stats_response = requests.get(f"{BACKEND_URL}/looks/stats/favoritos", 
                                        headers=headers, 
                                        timeout=30)
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                if "count" in stats_data:
                    results.add_result("Look Management - Favorites Stats", True)
                    print(f"   Favorites count: {stats_data['count']}")
                else:
                    results.add_result("Look Management - Favorites Stats", False, "Missing count in response")
            else:
                results.add_result("Look Management - Favorites Stats", False, f"HTTP {stats_response.status_code}")
            
            # Test DELETE /api/looks/{id}
            delete_response = requests.delete(f"{BACKEND_URL}/looks/{look_id}", 
                                            headers=headers, 
                                            timeout=30)
            
            if delete_response.status_code == 200:
                results.add_result("Look Management - Delete Look", True)
                print(f"   Look deleted successfully")
            else:
                results.add_result("Look Management - Delete Look", False, f"HTTP {delete_response.status_code}")
                
        else:
            results.add_result("Look Management - Create Look", False, f"HTTP {create_response.status_code}: {create_response.text}")
            
    except Exception as e:
        results.add_result("Look Management - Exception", False, f"Exception: {str(e)}")
    
    return results

def test_subscription_system(token):
    """Test subscription-related endpoints"""
    results = TestResults()
    
    print(f"\n💳 Testing Subscription System Endpoints")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        # Test GET /api/status-assinatura
        status_response = requests.get(f"{BACKEND_URL}/status-assinatura", headers=headers, timeout=30)
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            expected_fields = ["plano_ativo", "looks_usados"]
            
            missing_fields = [field for field in expected_fields if field not in status_data]
            
            if not missing_fields:
                results.add_result("Subscription - Status Check", True)
                print(f"   Plan: {status_data.get('plano_ativo')}")
                print(f"   Looks used: {status_data.get('looks_usados')}")
            else:
                results.add_result("Subscription - Status Check", False, f"Missing fields: {missing_fields}")
        else:
            results.add_result("Subscription - Status Check", False, f"HTTP {status_response.status_code}: {status_response.text}")
        
        # Test GET /api/planos
        plans_response = requests.get(f"{BACKEND_URL}/planos", headers=headers, timeout=30)
        
        if plans_response.status_code == 200:
            plans_data = plans_response.json()
            if isinstance(plans_data, list) and len(plans_data) > 0:
                results.add_result("Subscription - Plans List", True)
                print(f"   Found {len(plans_data)} plans")
            else:
                results.add_result("Subscription - Plans List", False, "No plans found or invalid format")
        else:
            results.add_result("Subscription - Plans List", False, f"HTTP {plans_response.status_code}: {plans_response.text}")
            
    except Exception as e:
        results.add_result("Subscription - Exception", False, f"Exception: {str(e)}")
    
    return results

def test_profile_and_suggestions(token):
    """Test profile and suggestions endpoints"""
    results = TestResults()
    
    print(f"\n👤 Testing Profile and Suggestions Endpoints")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test POST /api/sugestoes (user feedback)
        suggestion_data = {
            "mensagem": "Adorei o app! Sugestão: adicionar mais opções de cores."
        }
        
        feedback_response = requests.post(f"{BACKEND_URL}/sugestoes", 
                                        json=suggestion_data, 
                                        headers=headers, 
                                        timeout=30)
        
        if feedback_response.status_code == 200:
            results.add_result("Profile - User Feedback", True)
            print(f"   Feedback submitted successfully")
        else:
            results.add_result("Profile - User Feedback", False, f"HTTP {feedback_response.status_code}: {feedback_response.text}")
        
        # Test POST /api/upload-foto-corpo
        form_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        body_photo_data = {
            "imagem": SAMPLE_IMAGE_BASE64
        }
        
        photo_response = requests.post(f"{BACKEND_URL}/upload-foto-corpo", 
                                     data=body_photo_data, 
                                     headers=form_headers, 
                                     timeout=30)
        
        if photo_response.status_code == 200:
            results.add_result("Profile - Upload Body Photo", True)
            print(f"   Body photo uploaded successfully")
        else:
            results.add_result("Profile - Upload Body Photo", False, f"HTTP {photo_response.status_code}: {photo_response.text}")
            
    except Exception as e:
        results.add_result("Profile - Exception", False, f"Exception: {str(e)}")
    
    return results

def main():
    """Main comprehensive test function"""
    print(f"🧪 COMPREHENSIVE BACKEND TEST SUITE")
    print(f"Testing all critical endpoints after environment variable refactoring")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    all_results = TestResults()
    
    # Step 1: Register user and login
    print(f"\n{'='*60}")
    print(f"STEP 1: AUTHENTICATION FLOW")
    print(f"{'='*60}")
    
    token, reg_results = test_user_registration_and_login()
    all_results.tests_run += reg_results.tests_run
    all_results.tests_passed += reg_results.tests_passed
    all_results.tests_failed += reg_results.tests_failed
    all_results.failures.extend(reg_results.failures)
    
    if not token:
        print(f"\n❌ Cannot proceed without authentication token")
        all_results.print_summary()
        return False
    
    # Step 2: Test auth/me endpoint
    auth_results = test_authentication_flow(token)
    all_results.tests_run += auth_results.tests_run
    all_results.tests_passed += auth_results.tests_passed
    all_results.tests_failed += auth_results.tests_failed
    all_results.failures.extend(auth_results.failures)
    
    # Step 3: Test clothes management
    print(f"\n{'='*60}")
    print(f"STEP 2: CLOTHES MANAGEMENT")
    print(f"{'='*60}")
    
    clothing_id, upload_results = test_upload_roupa_endpoint(token)
    all_results.tests_run += upload_results.tests_run
    all_results.tests_passed += upload_results.tests_passed
    all_results.tests_failed += upload_results.tests_failed
    all_results.failures.extend(upload_results.failures)
    
    if clothing_id:
        get_results = test_get_roupas_endpoint(token, clothing_id)
        all_results.tests_run += get_results.tests_run
        all_results.tests_passed += get_results.tests_passed
        all_results.tests_failed += get_results.tests_failed
        all_results.failures.extend(get_results.failures)
    
    # Step 4: Test AI look generation
    print(f"\n{'='*60}")
    print(f"STEP 3: AI LOOK GENERATION")
    print(f"{'='*60}")
    
    ai_results = test_look_generation(token)
    all_results.tests_run += ai_results.tests_run
    all_results.tests_passed += ai_results.tests_passed
    all_results.tests_failed += ai_results.tests_failed
    all_results.failures.extend(ai_results.failures)
    
    # Step 5: Test look management
    print(f"\n{'='*60}")
    print(f"STEP 4: LOOK MANAGEMENT")
    print(f"{'='*60}")
    
    look_results = test_look_management(token)
    all_results.tests_run += look_results.tests_run
    all_results.tests_passed += look_results.tests_passed
    all_results.tests_failed += look_results.tests_failed
    all_results.failures.extend(look_results.failures)
    
    # Step 6: Test subscription system
    print(f"\n{'='*60}")
    print(f"STEP 5: SUBSCRIPTION SYSTEM")
    print(f"{'='*60}")
    
    sub_results = test_subscription_system(token)
    all_results.tests_run += sub_results.tests_run
    all_results.tests_passed += sub_results.tests_passed
    all_results.tests_failed += sub_results.tests_failed
    all_results.failures.extend(sub_results.failures)
    
    # Step 7: Test profile and suggestions
    print(f"\n{'='*60}")
    print(f"STEP 6: PROFILE & SUGGESTIONS")
    print(f"{'='*60}")
    
    profile_results = test_profile_and_suggestions(token)
    all_results.tests_run += profile_results.tests_run
    all_results.tests_passed += profile_results.tests_passed
    all_results.tests_failed += profile_results.tests_failed
    all_results.failures.extend(profile_results.failures)
    
    # Print final summary
    print(f"\n{'='*60}")
    print(f"FINAL RESULTS")
    print(f"{'='*60}")
    
    success = all_results.print_summary()
    
    if success:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"✅ Authentication flow working correctly")
        print(f"✅ Clothes management endpoints functional")
        print(f"✅ AI look generation working")
        print(f"✅ Look CRUD operations successful")
        print(f"✅ Subscription system responding")
        print(f"✅ Profile and feedback endpoints working")
        print(f"✅ No regressions detected after environment variable refactoring")
    else:
        print(f"\n⚠️  SOME TESTS FAILED!")
        print(f"Please review the failures above to identify any regressions.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)