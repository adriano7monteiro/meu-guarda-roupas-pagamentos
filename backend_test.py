#!/usr/bin/env python3
"""
Backend Test Suite for Meu Look IA - Virtual Try-On Focus
URGENT TEST: Verificar funcionalidade de virtual try-on
Testing the virtual try-on functionality as requested by user
"""

import requests
import json
import base64
import logging
import os
import time
from datetime import datetime

# Configure logging to see detailed output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get backend URL from frontend env
BACKEND_URL = "https://fashionai-12.preview.emergentagent.com/api"

class VirtualTryOnTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_id = None
        self.clothing_ids = []
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}")
        if details:
            logger.info(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def create_test_image_base64(self, width=400, height=600, image_type="body"):
        """Create a realistic test image in base64 format"""
        # Create a simple colored rectangle as base64 image
        if image_type == "body":
            # Create a body-like image (taller rectangle)
            color = "lightblue"
        else:
            # Create a clothing item (square-ish)
            color = "red"
            height = width
            
        # Simple SVG converted to base64
        svg_content = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="{color}"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="white">
                {"Test Body Photo" if image_type == "body" else "Test Clothing"}
            </text>
        </svg>'''
        
        # Convert SVG to base64 (simulating a real image)
        svg_b64 = base64.b64encode(svg_content.encode()).decode()
        return f"data:image/svg+xml;base64,{svg_b64}"
    
    def create_test_user(self):
        """Create a test user for testing"""
        user_data = {
            "email": f"tryontest_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "testpass123",
            "nome": "Virtual Try-On Tester",
            "ocasiao_preferida": "casual"
        }
        
        logger.info("Creating test user for virtual try-on...")
        response = requests.post(f"{self.base_url}/auth/register", json=user_data)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data["token"]
            self.user_id = data["user"]["email"]
            self.log_test("User Registration", True, f"User created: {self.user_id}")
            return True
        elif response.status_code == 400 and "already registered" in response.text:
            # Try login instead
            return self.login_existing_user(user_data["email"], user_data["password"])
        else:
            self.log_test("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def login_existing_user(self, email: str, password: str):
        """Login with existing user"""
        login_data = {"email": email, "password": password}
        response = requests.post(f"{self.base_url}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data["token"]
            self.user_id = data["user"]["email"]
            self.log_test("User Login", True, f"Logged in: {self.user_id}")
            return True
        else:
            self.log_test("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def create_sample_clothing(self):
        """Create sample clothing items for testing"""
        # Simple base64 image (1x1 pixel PNG)
        sample_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        clothing_items = [
            {
                "tipo": "camiseta",
                "cor": "azul",
                "estilo": "casual",
                "nome": "Camiseta Azul Casual",
                "imagem_original": sample_image
            },
            {
                "tipo": "calca",
                "cor": "preta",
                "estilo": "social",
                "nome": "Calça Social Preta",
                "imagem_original": sample_image
            },
            {
                "tipo": "sapato",
                "cor": "marrom",
                "estilo": "casual",
                "nome": "Sapato Casual Marrom",
                "imagem_original": sample_image
            }
        ]
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        for item in clothing_items:
            logger.info(f"Creating clothing item: {item['nome']}")
            response = requests.post(f"{self.base_url}/upload-roupa", json=item, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.clothing_ids.append(data["id"])
                logger.info(f"✅ Clothing item created: {item['nome']} (ID: {data['id']})")
            else:
                logger.error(f"❌ Failed to create clothing item {item['nome']}: {response.status_code} - {response.text}")
                return False
        
        return len(self.clothing_ids) > 0
    
    def test_sugerir_look_endpoint(self):
        """
        Test the POST /api/sugerir-look endpoint specifically
        Focus on investigating JSON response issues
        """
        logger.info("=" * 60)
        logger.info("TESTING POST /api/sugerir-look ENDPOINT")
        logger.info("=" * 60)
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test data as specified in the review request
        test_data = {
            "ocasiao": "trabalho",
            "temperatura": "amena"
        }
        
        logger.info(f"Making request to: {self.base_url}/sugerir-look")
        logger.info(f"Request data: {test_data}")
        logger.info(f"User has {len(self.clothing_ids)} clothing items")
        
        # Make the API call
        response = requests.post(f"{self.base_url}/sugerir-look", data=test_data, headers=headers)
        
        logger.info(f"Response status code: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                logger.info("✅ API call successful")
                logger.info("=" * 40)
                logger.info("RESPONSE ANALYSIS:")
                logger.info("=" * 40)
                
                # Analyze the response structure
                logger.info(f"Response keys: {list(response_data.keys())}")
                
                # Focus on the sugestao_texto field
                sugestao_texto = response_data.get("sugestao_texto", "")
                logger.info(f"sugestao_texto length: {len(sugestao_texto)} characters")
                logger.info(f"sugestao_texto type: {type(sugestao_texto)}")
                
                # Check if it looks like JSON
                is_json_like = sugestao_texto.strip().startswith('{') and sugestao_texto.strip().endswith('}')
                logger.info(f"Does sugestao_texto look like JSON? {is_json_like}")
                
                # Show the actual content
                logger.info("=" * 40)
                logger.info("SUGESTAO_TEXTO CONTENT:")
                logger.info("=" * 40)
                logger.info(f"'{sugestao_texto}'")
                
                # Try to parse it as JSON to see if it's malformed JSON
                if is_json_like:
                    try:
                        parsed_json = json.loads(sugestao_texto)
                        logger.warning("⚠️  PROBLEM FOUND: sugestao_texto contains valid JSON instead of formatted text!")
                        logger.info(f"Parsed JSON: {parsed_json}")
                    except json.JSONDecodeError as e:
                        logger.warning(f"⚠️  PROBLEM FOUND: sugestao_texto contains malformed JSON: {e}")
                
                # Show other fields
                logger.info("=" * 40)
                logger.info("OTHER RESPONSE FIELDS:")
                logger.info("=" * 40)
                for key, value in response_data.items():
                    if key != "sugestao_texto":
                        logger.info(f"{key}: {value}")
                
                # Check if this is the expected format
                expected_fields = ["sugestao_texto", "roupas_ids", "dicas", "ocasiao", "temperatura"]
                missing_fields = [field for field in expected_fields if field not in response_data]
                if missing_fields:
                    logger.warning(f"⚠️  Missing expected fields: {missing_fields}")
                
                return True, response_data
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse response as JSON: {e}")
                logger.error(f"Raw response: {response.text}")
                return False, None
        else:
            logger.error(f"❌ API call failed: {response.status_code}")
            logger.error(f"Error response: {response.text}")
            return False, None
    
    def check_backend_logs(self):
        """Check backend logs for AI response details"""
        logger.info("=" * 60)
        logger.info("CHECKING BACKEND LOGS")
        logger.info("=" * 60)
        
        try:
            # Check supervisor backend logs
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info("Backend error logs (last 100 lines):")
                logger.info("-" * 40)
                lines = result.stdout.split('\n')
                for line in lines:
                    if any(keyword in line.lower() for keyword in ['json', 'parse', 'sugerir', 'response', 'failed']):
                        logger.info(f"🔍 RELEVANT LOG: {line}")
            else:
                logger.warning("Could not read backend error logs")
            
            # Check output logs
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0 and result.stdout.strip():
                logger.info("Backend output logs (last 50 lines):")
                logger.info("-" * 40)
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'sugerir-look' in line:
                        logger.info(f"🔍 SUGERIR-LOOK LOG: {line}")
            else:
                logger.info("No recent output logs")
                
        except Exception as e:
            logger.error(f"Error checking logs: {e}")
    
    def run_specific_test(self):
        """Run the specific test requested in the review"""
        logger.info("🔍 STARTING SPECIFIC TEST FOR POST /api/sugerir-look JSON ISSUE")
        logger.info("=" * 80)
        
        # Step 1: Create test user
        if not self.create_test_user():
            return False
        
        # Step 2: Create sample clothing
        if not self.create_sample_clothing():
            return False
        
        # Step 3: Test the sugerir-look endpoint
        success, response_data = self.test_sugerir_look_endpoint()
        
        # Step 4: Check backend logs
        self.check_backend_logs()
        
        # Step 5: Analysis and conclusions
        logger.info("=" * 60)
        logger.info("TEST ANALYSIS & CONCLUSIONS")
        logger.info("=" * 60)
        
        if success and response_data:
            sugestao_texto = response_data.get("sugestao_texto", "")
            
            # Determine the issue
            if sugestao_texto.strip().startswith('{') and sugestao_texto.strip().endswith('}'):
                logger.error("🚨 ISSUE CONFIRMED: AI is returning JSON in sugestao_texto field")
                logger.error("   This explains why users see JSON instead of formatted text")
                
                try:
                    json.loads(sugestao_texto)
                    logger.error("   The JSON is valid, so parsing should work")
                    logger.error("   Problem: AI is not following the prompt instructions properly")
                except json.JSONDecodeError:
                    logger.error("   The JSON is malformed, causing parsing to fail")
                    logger.error("   Problem: AI returns malformed JSON, fallback should handle this")
            else:
                logger.info("✅ sugestao_texto appears to be formatted text (not JSON)")
                logger.info("   The issue might be intermittent or already resolved")
        
        return success

def main():
    """Main test function"""
    tester = BackendTester()
    success = tester.run_specific_test()
    
    if success:
        logger.info("🎉 Test completed successfully")
    else:
        logger.error("💥 Test failed")
    
    return success

if __name__ == "__main__":
    main()