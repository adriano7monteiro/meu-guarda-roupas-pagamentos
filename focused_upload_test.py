#!/usr/bin/env python3
"""
Focused test for POST /api/upload-roupa 403 Forbidden issue
Testing with exact user scenario and data
"""

import requests
import json
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get backend URL from frontend env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

logger.info(f"Testing backend at: {API_URL}")

class FocusedUploadTester:
    def __init__(self):
        self.token = None
        self.user_data = {
            "email": "teste.upload.focused@example.com",
            "password": "senha123",
            "nome": "Teste Upload User",
            "ocasiao_preferida": "casual"
        }
        # Exact data from user's request
        self.test_clothing_data = {
            "nome": "Teste Backend",
            "tipo": "camiseta", 
            "cor": "azul",
            "estilo": "casual",
            "imagem_original": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }

    def register_and_login(self):
        """Register user and get authentication token"""
        try:
            # Try to register (might fail if user exists, that's ok)
            register_response = requests.post(
                f"{API_URL}/auth/register",
                json=self.user_data,
                timeout=10
            )
            
            if register_response.status_code in [200, 201]:
                data = register_response.json()
                self.token = data.get("token")
                logger.info("✅ User registered successfully")
                return True
            elif register_response.status_code == 400:
                logger.info("User already exists, trying login...")
            else:
                logger.error(f"Registration failed: {register_response.status_code} - {register_response.text}")
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")

        # Try login
        try:
            login_response = requests.post(
                f"{API_URL}/auth/login",
                json={
                    "email": self.user_data["email"],
                    "password": self.user_data["password"]
                },
                timeout=10
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.token = data.get("token")
                logger.info("✅ Login successful")
                logger.info(f"Token received: {self.token[:50]}...")
                return True
            else:
                logger.error(f"Login failed: {login_response.status_code} - {login_response.text}")
                return False
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return False

    def test_auth_me(self):
        """Test GET /api/auth/me endpoint"""
        if not self.token:
            logger.error("No token available for auth/me test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            logger.info(f"Testing GET /api/auth/me with headers: {headers}")
            
            response = requests.get(f"{API_URL}/auth/me", headers=headers, timeout=10)
            
            logger.info(f"GET /api/auth/me - Status: {response.status_code}")
            logger.info(f"GET /api/auth/me - Response: {response.text}")
            
            if response.status_code == 200:
                logger.info("✅ GET /api/auth/me - SUCCESS")
                return True
            else:
                logger.error(f"❌ GET /api/auth/me - FAILED: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"❌ GET /api/auth/me - ERROR: {str(e)}")
            return False

    def test_get_roupas(self):
        """Test GET /api/roupas endpoint"""
        if not self.token:
            logger.error("No token available for roupas test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            logger.info(f"Testing GET /api/roupas with headers: {headers}")
            
            response = requests.get(f"{API_URL}/roupas", headers=headers, timeout=10)
            
            logger.info(f"GET /api/roupas - Status: {response.status_code}")
            logger.info(f"GET /api/roupas - Response: {response.text}")
            
            if response.status_code == 200:
                logger.info("✅ GET /api/roupas - SUCCESS")
                return True
            else:
                logger.error(f"❌ GET /api/roupas - FAILED: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"❌ GET /api/roupas - ERROR: {str(e)}")
            return False

    def test_upload_roupa_detailed(self):
        """Test POST /api/upload-roupa endpoint with detailed logging"""
        if not self.token:
            logger.error("No token available for upload test")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            logger.info("=" * 60)
            logger.info("DETAILED TEST: POST /api/upload-roupa")
            logger.info("=" * 60)
            logger.info(f"URL: {API_URL}/upload-roupa")
            logger.info(f"Token: {self.token[:50]}...")
            logger.info(f"Headers: {json.dumps(headers, indent=2)}")
            logger.info(f"Data: {json.dumps(self.test_clothing_data, indent=2)}")
            logger.info("=" * 60)
            
            response = requests.post(
                f"{API_URL}/upload-roupa",
                json=self.test_clothing_data,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"Response Status: {response.status_code}")
            logger.info(f"Response Headers: {dict(response.headers)}")
            logger.info(f"Response Text: {response.text}")
            
            if response.status_code == 200:
                logger.info("✅ POST /api/upload-roupa - SUCCESS")
                return True
            elif response.status_code == 403:
                logger.error("❌ POST /api/upload-roupa - 403 FORBIDDEN")
                logger.error("🔍 This confirms the user's reported issue!")
                
                # Let's check backend logs for more details
                logger.info("Checking backend logs for more details...")
                self.check_backend_logs()
                return False
            else:
                logger.error(f"❌ POST /api/upload-roupa - FAILED: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"❌ POST /api/upload-roupa - ERROR: {str(e)}")
            return False

    def check_backend_logs(self):
        """Check backend logs for error details"""
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.stdout:
                logger.info("Backend Error Logs:")
                logger.info(result.stdout)
            
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.stdout:
                logger.info("Backend Output Logs:")
                logger.info(result.stdout)
        except Exception as e:
            logger.error(f"Could not check backend logs: {str(e)}")

    def run_focused_test(self):
        """Run focused test on the upload endpoint issue"""
        logger.info("=" * 80)
        logger.info("FOCUSED TEST: POST /api/upload-roupa 403 Forbidden Issue")
        logger.info("Reproducing exact user scenario")
        logger.info("=" * 80)
        
        # Step 1: Authentication
        logger.info("\n1. Testing Authentication...")
        if not self.register_and_login():
            logger.error("❌ Authentication failed - cannot proceed")
            return False
        
        # Step 2: Test working endpoints with same token
        logger.info("\n2. Testing working endpoints with same token...")
        auth_me_works = self.test_auth_me()
        get_roupas_works = self.test_get_roupas()
        
        # Step 3: Test the problematic endpoint with detailed logging
        logger.info("\n3. Testing problematic endpoint with detailed logging...")
        upload_works = self.test_upload_roupa_detailed()
        
        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("FOCUSED TEST SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Authentication: {'✅ SUCCESS' if self.token else '❌ FAILED'}")
        logger.info(f"GET /api/auth/me: {'✅ SUCCESS' if auth_me_works else '❌ FAILED'}")
        logger.info(f"GET /api/roupas: {'✅ SUCCESS' if get_roupas_works else '❌ FAILED'}")
        logger.info(f"POST /api/upload-roupa: {'✅ SUCCESS' if upload_works else '❌ FAILED'}")
        
        if auth_me_works and get_roupas_works and not upload_works:
            logger.error("\n🔍 ISSUE ANALYSIS:")
            logger.error("- Same token works for GET /api/auth/me and GET /api/roupas")
            logger.error("- Same token fails with 403 for POST /api/upload-roupa")
            logger.error("- This indicates a specific authentication issue with the upload endpoint")
            logger.error("- Possible causes:")
            logger.error("  1. Different authentication logic in upload endpoint")
            logger.error("  2. Missing or incorrect dependency injection")
            logger.error("  3. Token validation issue specific to this endpoint")
        elif upload_works:
            logger.info("\n✅ ISSUE NOT REPRODUCED:")
            logger.info("- Upload endpoint is working correctly")
            logger.info("- This might be a transient issue or environment-specific")
        
        return upload_works

if __name__ == "__main__":
    tester = FocusedUploadTester()
    success = tester.run_focused_test()
    
    if not success:
        logger.info("\n🔧 RECOMMENDED NEXT STEPS:")
        logger.info("1. Check backend logs for authentication errors")
        logger.info("2. Verify upload endpoint authentication dependency")
        logger.info("3. Compare working vs non-working endpoint implementations")
        logger.info("4. Test with different token formats or headers")
        
    exit(0 if success else 1)