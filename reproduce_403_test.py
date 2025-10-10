#!/usr/bin/env python3
"""
Specific test to reproduce the 403 Forbidden error on POST /api/upload-roupa
Based on the exact scenario from the user's request
"""

import requests
import json
import logging
import os
import time
import threading
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

class Reproduce403Tester:
    def __init__(self):
        self.results = []
        self.test_clothing_data = {
            "nome": "Teste Backend",
            "tipo": "camiseta", 
            "cor": "azul",
            "estilo": "casual",
            "imagem_original": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }

    def create_user_and_get_token(self, user_id):
        """Create a user and get authentication token"""
        user_data = {
            "email": f"reproduce403.{user_id}@example.com",
            "password": "senha123",
            "nome": f"Reproduce User {user_id}",
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
                return token
            elif register_response.status_code == 400:
                # User exists, try login
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
                    return data.get("token")
            
            return None
        except Exception as e:
            logger.error(f"Error creating user {user_id}: {str(e)}")
            return None

    def test_scenario_1_rapid_requests(self):
        """Test rapid consecutive requests with same token"""
        logger.info("Testing Scenario 1: Rapid consecutive requests")
        
        token = self.create_user_and_get_token("rapid")
        if not token:
            logger.error("Could not get token for rapid test")
            return
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Make 10 rapid requests
        for i in range(10):
            try:
                response = requests.post(
                    f"{API_URL}/upload-roupa",
                    json=self.test_clothing_data,
                    headers=headers,
                    timeout=5
                )
                
                logger.info(f"Rapid request {i+1}: Status {response.status_code}")
                
                if response.status_code == 403:
                    logger.error(f"🎯 FOUND 403 ERROR on rapid request {i+1}!")
                    logger.error(f"Response: {response.text}")
                    self.results.append(f"403 on rapid request {i+1}")
                    
            except Exception as e:
                logger.error(f"Error on rapid request {i+1}: {str(e)}")
            
            time.sleep(0.1)  # Very short delay

    def test_scenario_2_mixed_endpoints(self):
        """Test mixing upload with other endpoints"""
        logger.info("Testing Scenario 2: Mixed endpoint calls")
        
        token = self.create_user_and_get_token("mixed")
        if not token:
            logger.error("Could not get token for mixed test")
            return
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Pattern: auth/me -> roupas -> upload -> auth/me -> upload
        endpoints = [
            ("GET", "/auth/me", None),
            ("GET", "/roupas", None),
            ("POST", "/upload-roupa", self.test_clothing_data),
            ("GET", "/auth/me", None),
            ("POST", "/upload-roupa", self.test_clothing_data),
        ]
        
        for i, (method, endpoint, data) in enumerate(endpoints):
            try:
                if method == "GET":
                    response = requests.get(f"{API_URL}{endpoint}", headers=headers, timeout=10)
                else:
                    response = requests.post(f"{API_URL}{endpoint}", json=data, headers=headers, timeout=10)
                
                logger.info(f"Mixed {i+1} ({method} {endpoint}): Status {response.status_code}")
                
                if response.status_code == 403 and endpoint == "/upload-roupa":
                    logger.error(f"🎯 FOUND 403 ERROR on mixed request {i+1}!")
                    logger.error(f"Response: {response.text}")
                    self.results.append(f"403 on mixed request {i+1}")
                    
            except Exception as e:
                logger.error(f"Error on mixed request {i+1}: {str(e)}")
            
            time.sleep(0.2)

    def test_scenario_3_concurrent_users(self):
        """Test concurrent uploads from different users"""
        logger.info("Testing Scenario 3: Concurrent users")
        
        def upload_worker(user_id):
            token = self.create_user_and_get_token(f"concurrent_{user_id}")
            if not token:
                return
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            try:
                response = requests.post(
                    f"{API_URL}/upload-roupa",
                    json=self.test_clothing_data,
                    headers=headers,
                    timeout=10
                )
                
                logger.info(f"Concurrent user {user_id}: Status {response.status_code}")
                
                if response.status_code == 403:
                    logger.error(f"🎯 FOUND 403 ERROR on concurrent user {user_id}!")
                    logger.error(f"Response: {response.text}")
                    self.results.append(f"403 on concurrent user {user_id}")
                    
            except Exception as e:
                logger.error(f"Error on concurrent user {user_id}: {str(e)}")
        
        # Start 5 concurrent threads
        threads = []
        for i in range(5):
            thread = threading.Thread(target=upload_worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()

    def test_scenario_4_token_edge_cases(self):
        """Test edge cases with tokens"""
        logger.info("Testing Scenario 4: Token edge cases")
        
        token = self.create_user_and_get_token("edge")
        if not token:
            logger.error("Could not get token for edge test")
            return
        
        # Test various header formats
        test_cases = [
            {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            {"Authorization": f"bearer {token}", "Content-Type": "application/json"},  # lowercase
            {"Authorization": f"Bearer  {token}", "Content-Type": "application/json"},  # extra space
            {"Authorization": f"Bearer {token} ", "Content-Type": "application/json"},  # trailing space
        ]
        
        for i, headers in enumerate(test_cases):
            try:
                response = requests.post(
                    f"{API_URL}/upload-roupa",
                    json=self.test_clothing_data,
                    headers=headers,
                    timeout=10
                )
                
                logger.info(f"Edge case {i+1}: Status {response.status_code}")
                
                if response.status_code == 403:
                    logger.error(f"🎯 FOUND 403 ERROR on edge case {i+1}!")
                    logger.error(f"Headers: {headers}")
                    logger.error(f"Response: {response.text}")
                    self.results.append(f"403 on edge case {i+1}")
                    
            except Exception as e:
                logger.error(f"Error on edge case {i+1}: {str(e)}")

    def run_reproduction_tests(self):
        """Run all tests to try to reproduce the 403 error"""
        logger.info("=" * 80)
        logger.info("REPRODUCTION TESTS: Trying to reproduce 403 Forbidden error")
        logger.info("=" * 80)
        
        self.test_scenario_1_rapid_requests()
        time.sleep(1)
        
        self.test_scenario_2_mixed_endpoints()
        time.sleep(1)
        
        self.test_scenario_3_concurrent_users()
        time.sleep(1)
        
        self.test_scenario_4_token_edge_cases()
        
        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("REPRODUCTION TEST SUMMARY")
        logger.info("=" * 80)
        
        if self.results:
            logger.error(f"🎯 SUCCESSFULLY REPRODUCED 403 ERRORS: {len(self.results)} times")
            for result in self.results:
                logger.error(f"  - {result}")
        else:
            logger.info("❌ Could not reproduce the 403 error")
            logger.info("The error might be:")
            logger.info("  - Very rare/intermittent")
            logger.info("  - Dependent on specific server state")
            logger.info("  - Related to load or timing")
            logger.info("  - Fixed by recent changes")

if __name__ == "__main__":
    tester = Reproduce403Tester()
    tester.run_reproduction_tests()