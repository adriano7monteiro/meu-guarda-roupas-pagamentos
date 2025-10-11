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
        try:
            from PIL import Image, ImageDraw, ImageFont
            import io
            
            # Create a new image with RGB mode
            if image_type == "body":
                # Create a body-like image (taller rectangle)
                color = (173, 216, 230)  # lightblue
                img = Image.new('RGB', (width, height), color)
            else:
                # Create a clothing item (square-ish)
                color = (255, 0, 0)  # red
                img = Image.new('RGB', (width, width), color)
                height = width
            
            # Add some text to the image
            draw = ImageDraw.Draw(img)
            try:
                # Try to use a default font
                font = ImageFont.load_default()
            except:
                font = None
            
            text = "Test Body Photo" if image_type == "body" else "Test Clothing"
            
            # Calculate text position (center)
            if font:
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            else:
                text_width = len(text) * 6  # Approximate
                text_height = 11
            
            x = (img.width - text_width) // 2
            y = (img.height - text_height) // 2
            
            draw.text((x, y), text, fill=(255, 255, 255), font=font)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            img_b64 = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/jpeg;base64,{img_b64}"
            
        except ImportError:
            # Fallback to a simple 1x1 pixel image if PIL is not available
            # This is a minimal valid JPEG base64 image
            minimal_jpeg = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
            return f"data:image/jpeg;base64,{minimal_jpeg}"
    
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
            logger.info(f"🔍 API Key being used: b6f0f11d-2620-49cb-9d9b-342b6a877915:4340b42a760df77a641cd8d5c0794b8b")
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
        """Check backend logs for detailed error information"""
        try:
            logger.info("=" * 60)
            logger.info("CHECKING BACKEND LOGS FOR FAL.AI ERRORS")
            logger.info("=" * 60)
            
            # Check supervisor logs
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logs = result.stdout
                logger.info(f"🔍 Backend Error Logs (last 50 lines):")
                logger.info(logs)
                
                # Look for specific Fal.ai errors
                if "401" in logs and "No user found for Key ID" in logs:
                    logger.error("❌ FOUND: 401 Authentication error with Fal.ai API")
                    return "401_auth_error"
                elif "422" in logs and "Failed to detect body pose" in logs:
                    logger.error("❌ FOUND: 422 Body pose detection error")
                    return "422_pose_error"
                elif "403" in logs and "Exhausted balance" in logs:
                    logger.error("❌ FOUND: 403 Exhausted balance error")
                    return "403_balance_error"
                else:
                    logger.info("ℹ️ No specific Fal.ai errors found in recent logs")
                    return "no_specific_error"
            else:
                logger.warning("⚠️ Could not read backend logs")
                return "log_read_error"
                
        except Exception as e:
            logger.error(f"⚠️ Error checking logs: {str(e)}")
            return "log_check_exception"
    
    def run_virtual_tryon_tests(self):
        """Run all virtual try-on tests in sequence"""
        logger.info("🚀 Starting Virtual Try-On Test Suite")
        logger.info("=" * 50)
        
        # Test sequence
        tests = [
            ("User Registration/Login", self.create_test_user),
            ("Upload Body Photo", self.upload_body_photo),
            ("Upload Clothing", self.create_sample_clothing),
            ("Virtual Try-On API", self.test_virtual_tryon_api)
        ]
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running: {test_name}")
            success = test_func()
            if not success and test_name != "Virtual Try-On API":
                logger.error(f"❌ Stopping tests due to failure in: {test_name}")
                break
        
        # Always check logs for debugging
        logger.info(f"\n📋 Checking Backend Logs")
        log_status = self.check_backend_logs()
        
        # Summary
        logger.info("\n" + "=" * 50)
        logger.info("📊 TEST SUMMARY")
        logger.info("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        logger.info(f"Tests Passed: {passed}/{total}")
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            logger.info(f"{status} {result['test']}")
            if result["details"]:
                logger.info(f"   {result['details']}")
        
        # Specific analysis for virtual try-on
        logger.info(f"\n🔍 VIRTUAL TRY-ON ANALYSIS:")
        logger.info(f"Backend Log Status: {log_status}")
        
        if log_status == "401_auth_error":
            logger.error("❌ CRITICAL: Fal.ai API Key authentication failed")
            logger.error("   Current key: b6f0f11d-2620-49cb-9d9b-342b6a877915:4340b42a760df77a641cd8d5c0794b8b")
            logger.error("   Action needed: Verify API key validity with Fal.ai")
        elif log_status == "422_pose_error":
            logger.warning("⚠️ WARNING: Fal.ai cannot detect body pose in uploaded images")
            logger.warning("   Action needed: Use real human photos with clear body poses")
        elif log_status == "403_balance_error":
            logger.warning("⚠️ WARNING: Fal.ai account balance exhausted")
            logger.warning("   Action needed: Add credits to Fal.ai account")
        
        return passed == total

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