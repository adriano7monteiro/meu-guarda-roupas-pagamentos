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
    
    def upload_body_photo(self):
        """Upload body photo for virtual try-on"""
        try:
            body_image = self.create_test_image_base64(400, 600, "body")
            
            form_data = {"imagem": body_image}
            headers = {"Authorization": f"Bearer {self.token}"}
            
            response = requests.post(f"{self.base_url}/upload-foto-corpo", data=form_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Upload Body Photo", True, "Body photo uploaded successfully")
                return True
            else:
                self.log_test("Upload Body Photo", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Upload Body Photo", False, f"Exception: {str(e)}")
            return False
    
    def create_sample_clothing(self):
        """Create sample clothing items for testing"""
        clothing_image = self.create_test_image_base64(300, 300, "clothing")
        
        clothing_data = {
            "tipo": "camiseta",
            "cor": "vermelha",
            "estilo": "casual",
            "nome": "Camiseta Teste Try-On",
            "imagem_original": clothing_image
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        logger.info(f"Creating clothing item: {clothing_data['nome']}")
        response = requests.post(f"{self.base_url}/upload-roupa", json=clothing_data, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            self.clothing_ids.append(data["id"])
            self.log_test("Upload Clothing", True, f"Clothing uploaded with ID: {data['id']}")
            return True
        else:
            self.log_test("Upload Clothing", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    
    def test_virtual_tryon_api(self):
        """Test the main virtual try-on API endpoint"""
        try:
            if not self.clothing_ids:
                self.log_test("Virtual Try-On API", False, "No clothing ID available - upload clothing first")
                return False
            
            form_data = {"roupa_ids": self.clothing_ids}
            headers = {"Authorization": f"Bearer {self.token}"}
            
            logger.info("=" * 60)
            logger.info("TESTING POST /api/gerar-look-visual ENDPOINT")
            logger.info("=" * 60)
            logger.info(f"🔍 Testing Virtual Try-On with clothing ID: {self.clothing_ids[0]}")
            logger.info(f"🔍 API Key being used: fashionai-12:78f494fb71ef1bff59badf506b514aeb")
            logger.info(f"🔍 Fal.ai endpoint: https://fal.run/fal-ai/fashn/tryon/v1.5")
            
            response = requests.post(f"{self.base_url}/gerar-look-visual", data=form_data, headers=headers)
            
            logger.info(f"🔍 Response Status: {response.status_code}")
            logger.info(f"🔍 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"🔍 Response Keys: {list(data.keys())}")
                logger.info(f"🔍 Full Response: {json.dumps(data, indent=2)}")
                
                # Check response structure
                required_fields = ["message", "clothing_items", "tryon_image", "status", "api_used"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Virtual Try-On API", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Check if API was called or fallback was used
                api_used = data.get("api_used", "unknown")
                tryon_image = data.get("tryon_image", "")
                status = data.get("status", "")
                note = data.get("note", "")
                
                logger.info(f"🔍 API Used: {api_used}")
                logger.info(f"🔍 Status: {status}")
                logger.info(f"🔍 Note: {note}")
                logger.info(f"🔍 Try-on Image Length: {len(tryon_image)} chars")
                
                if api_used == "fallback":
                    self.log_test("Virtual Try-On API", False, f"API in fallback mode. Note: {note}")
                    return False
                elif api_used == "fal.ai-fashn":
                    self.log_test("Virtual Try-On API", True, f"Fal.ai API working successfully. Image generated: {len(tryon_image)} chars")
                    return True
                else:
                    self.log_test("Virtual Try-On API", True, f"API responded successfully with status: {status}")
                    return True
                    
            else:
                self.log_test("Virtual Try-On API", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Virtual Try-On API", False, f"Exception: {str(e)}")
            return False
    
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