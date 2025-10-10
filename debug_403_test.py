#!/usr/bin/env python3
"""
Debug test for intermittent 403 Forbidden issue on POST /api/upload-roupa
Testing various scenarios that might cause the issue
"""

import requests
import json
import logging
import os
import time
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

class Debug403Tester:
    def __init__(self):
        self.tokens = []
        self.test_clothing_data = {
            "nome": "Teste Backend",
            "tipo": "camiseta", 
            "cor": "azul",
            "estilo": "casual",
            "imagem_original": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }

    def create_user_and_get_token(self, user_suffix):
        """Create a user and get authentication token"""
        user_data = {
            "email": f"debug403.{user_suffix}@example.com",
            "password": "senha123",
            "nome": f"Debug User {user_suffix}",
            "ocasiao_preferida": "casual"
        }
        
        try:
            # Try to register
            register_response = requests.post(
                f"{API_URL}/auth/register",
                json=user_data,
                timeout=10
            )
            
            if register_response.status_code in [200, 201]:
                data = register_response.json()
                token = data.get("token")
                logger.info(f"✅ User {user_suffix} registered successfully")
                return token
            elif register_response.status_code == 400:
                logger.info(f"User {user_suffix} already exists, trying login...")
            else:
                logger.error(f"Registration failed for user {user_suffix}: {register_response.status_code}")

            # Try login
            login_response = requests.post(
                f"{API_URL}/auth/login",
                json={
                    "email": user_data["email"],
                    "password": user_data["password"]
                },
                timeout=10
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                token = data.get("token")
                logger.info(f"✅ User {user_suffix} login successful")
                return token
            else:
                logger.error(f"Login failed for user {user_suffix}: {login_response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error creating user {user_suffix}: {str(e)}")
            return None

    def test_upload_with_token(self, token, test_name):
        """Test upload endpoint with a specific token"""
        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"Testing {test_name}...")
            
            response = requests.post(
                f"{API_URL}/upload-roupa",
                json=self.test_clothing_data,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"{test_name} - Status: {response.status_code}")
            
            if response.status_code == 200:
                logger.info(f"✅ {test_name} - SUCCESS")
                return True
            elif response.status_code == 403:
                logger.error(f"❌ {test_name} - 403 FORBIDDEN")
                logger.error(f"Response: {response.text}")
                return False
            else:
                logger.error(f"❌ {test_name} - Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"❌ {test_name} - ERROR: {str(e)}")
            return False

    def test_concurrent_uploads(self):
        """Test multiple concurrent uploads to see if there's a race condition"""
        logger.info("Testing concurrent uploads...")
        
        # Create multiple tokens
        tokens = []
        for i in range(3):
            token = self.create_user_and_get_token(f"concurrent_{i}")
            if token:
                tokens.append(token)
        
        if not tokens:
            logger.error("No tokens available for concurrent test")
            return False
        
        # Test uploads rapidly
        results = []
        for i, token in enumerate(tokens):
            result = self.test_upload_with_token(token, f"Concurrent Upload {i+1}")
            results.append(result)
            time.sleep(0.1)  # Small delay
        
        success_count = sum(results)
        logger.info(f"Concurrent uploads: {success_count}/{len(results)} successful")
        return all(results)

    def test_token_reuse(self):
        """Test reusing the same token multiple times"""
        logger.info("Testing token reuse...")
        
        token = self.create_user_and_get_token("reuse")
        if not token:
            logger.error("No token available for reuse test")
            return False
        
        results = []
        for i in range(5):
            result = self.test_upload_with_token(token, f"Token Reuse {i+1}")
            results.append(result)
            time.sleep(0.5)  # Small delay between requests
        
        success_count = sum(results)
        logger.info(f"Token reuse: {success_count}/{len(results)} successful")
        return all(results)

    def test_malformed_requests(self):
        """Test various malformed requests that might cause 403"""
        logger.info("Testing malformed requests...")
        
        token = self.create_user_and_get_token("malformed")
        if not token:
            logger.error("No token available for malformed test")
            return False
        
        test_cases = [
            {
                "name": "Missing Content-Type",
                "headers": {"Authorization": f"Bearer {token}"},
                "data": self.test_clothing_data
            },
            {
                "name": "Wrong Content-Type",
                "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/x-www-form-urlencoded"},
                "data": self.test_clothing_data
            },
            {
                "name": "Invalid JSON",
                "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                "data": "invalid json"
            }
        ]
        
        for test_case in test_cases:
            try:
                logger.info(f"Testing {test_case['name']}...")
                
                if test_case['name'] == "Invalid JSON":
                    response = requests.post(
                        f"{API_URL}/upload-roupa",
                        data=test_case['data'],
                        headers=test_case['headers'],
                        timeout=10
                    )
                else:
                    response = requests.post(
                        f"{API_URL}/upload-roupa",
                        json=test_case['data'],
                        headers=test_case['headers'],
                        timeout=10
                    )
                
                logger.info(f"{test_case['name']} - Status: {response.status_code}")
                
                if response.status_code == 403:
                    logger.error(f"❌ {test_case['name']} - 403 FORBIDDEN (This might be the issue!)")
                    logger.error(f"Response: {response.text}")
                
            except Exception as e:
                logger.error(f"Error in {test_case['name']}: {str(e)}")

    def run_debug_tests(self):
        """Run all debug tests to identify the 403 issue"""
        logger.info("=" * 80)
        logger.info("DEBUG TESTS: Investigating 403 Forbidden Issue")
        logger.info("=" * 80)
        
        # Test 1: Concurrent uploads
        logger.info("\n1. Testing concurrent uploads...")
        concurrent_success = self.test_concurrent_uploads()
        
        # Test 2: Token reuse
        logger.info("\n2. Testing token reuse...")
        reuse_success = self.test_token_reuse()
        
        # Test 3: Malformed requests
        logger.info("\n3. Testing malformed requests...")
        self.test_malformed_requests()
        
        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("DEBUG TEST SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Concurrent uploads: {'✅ SUCCESS' if concurrent_success else '❌ FAILED'}")
        logger.info(f"Token reuse: {'✅ SUCCESS' if reuse_success else '❌ FAILED'}")
        
        if not concurrent_success or not reuse_success:
            logger.error("\n🔍 POTENTIAL ISSUES IDENTIFIED:")
            if not concurrent_success:
                logger.error("- Concurrent upload requests may cause 403 errors")
            if not reuse_success:
                logger.error("- Token reuse may cause 403 errors")
        else:
            logger.info("\n✅ No obvious issues found in debug tests")
            logger.info("The 403 error might be:")
            logger.info("- Intermittent/transient")
            logger.info("- Related to specific request conditions")
            logger.info("- Environment or timing dependent")

if __name__ == "__main__":
    tester = Debug403Tester()
    tester.run_debug_tests()