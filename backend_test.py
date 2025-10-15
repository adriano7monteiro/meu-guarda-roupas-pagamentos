#!/usr/bin/env python3
"""
Backend Test Suite for Meu Look IA
Testing POST /api/upload-roupa after removal of imagem_sem_fundo field
"""

import requests
import json
import base64
import os
from datetime import datetime
import sys

# Configuration
BACKEND_URL = "https://lookgenerator.preview.emergentagent.com/api"

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

def test_mongodb_direct_verification():
    """Test direct MongoDB verification (if possible)"""
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
                
                # Get a sample clothing item
                sample_item = await db.clothing_items.find_one({}, {"_id": 0})
                
                if sample_item:
                    if "imagem_sem_fundo" not in sample_item:
                        results.add_result("MongoDB - No imagem_sem_fundo in Documents", True)
                        print(f"   ✅ Confirmed: MongoDB documents do NOT contain 'imagem_sem_fundo' field")
                        print(f"   Document fields: {list(sample_item.keys())}")
                    else:
                        results.add_result("MongoDB - No imagem_sem_fundo in Documents", False, "imagem_sem_fundo field found in MongoDB document")
                        print(f"   ❌ ERROR: 'imagem_sem_fundo' field found in MongoDB document")
                else:
                    results.add_result("MongoDB - Document Check", False, "No clothing items found in database")
                
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

def main():
    """Main test function"""
    tester = VirtualTryOnTester()
    success = tester.run_virtual_tryon_tests()
    
    if success:
        logger.info("🎉 All tests passed!")
    else:
        logger.error("⚠️ Some tests failed - check details above")
    
    return success

if __name__ == "__main__":
    main()