#!/usr/bin/env python3
"""
Backend Test Suite for Meu Look IA
Specific focus on POST /api/sugerir-look endpoint to investigate JSON response issues
"""

import requests
import json
import base64
import logging
import os
from datetime import datetime

# Configure logging to see detailed output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get backend URL from frontend env
BACKEND_URL = "https://outfit-ai-12.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_id = None
        self.clothing_ids = []
    
    def register_test_user(self) -> bool:
        """Register a test user with body photo"""
        try:
            # Create realistic body photo
            body_photo = f"data:image/png;base64,{self.create_realistic_base64_image(400, 600, 'person')}"
            
            user_data = {
                "email": f"test_fal_user_{int(time.time())}@test.com",
                "password": "TestPassword123!",
                "nome": "Fal AI Test User",
                "ocasiao_preferida": "casual"
            }
            
            logger.info(f"🔵 Registering test user: {user_data['email']}")
            response = requests.post(f"{self.base_url}/auth/register", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.user_id = data["user"]["email"]  # Using email as identifier
                logger.info(f"✅ User registered successfully")
                
                # Upload body photo
                headers = {"Authorization": f"Bearer {self.token}"}
                photo_data = {"imagem": body_photo}
                
                logger.info(f"🔵 Uploading body photo (size: {len(body_photo)} chars)")
                photo_response = requests.post(
                    f"{self.base_url}/upload-foto-corpo", 
                    data=photo_data, 
                    headers=headers
                )
                
                if photo_response.status_code == 200:
                    logger.info(f"✅ Body photo uploaded successfully")
                    return True
                else:
                    logger.error(f"❌ Failed to upload body photo: {photo_response.status_code} - {photo_response.text}")
                    return False
            else:
                logger.error(f"❌ Failed to register user: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error registering user: {str(e)}")
            return False
    
    def create_test_clothing(self) -> bool:
        """Create test clothing items with realistic images"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            clothing_items = [
                {
                    "tipo": "camiseta",
                    "cor": "azul",
                    "estilo": "casual",
                    "nome": "Camiseta Azul Casual",
                    "imagem_original": f"data:image/png;base64,{self.create_realistic_base64_image(300, 400, '#4169E1')}"
                },
                {
                    "tipo": "calca",
                    "cor": "preta",
                    "estilo": "social",
                    "nome": "Calça Preta Social",
                    "imagem_original": f"data:image/png;base64,{self.create_realistic_base64_image(300, 500, '#000000')}"
                }
            ]
            
            for item in clothing_items:
                logger.info(f"🔵 Creating clothing: {item['nome']} (image size: {len(item['imagem_original'])} chars)")
                response = requests.post(f"{self.base_url}/upload-roupa", json=item, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    self.clothing_ids.append(data["id"])
                    logger.info(f"✅ Clothing created: {item['nome']} (ID: {data['id']})")
                else:
                    logger.error(f"❌ Failed to create clothing {item['nome']}: {response.status_code} - {response.text}")
                    return False
            
            return len(self.clothing_ids) > 0
            
        except Exception as e:
            logger.error(f"❌ Error creating clothing: {str(e)}")
            return False
    
    def test_fal_ai_integration(self) -> Dict[str, Any]:
        """Test the Fal.ai virtual try-on integration with detailed logging"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Test with single clothing item first
            test_data = {"roupa_ids": [self.clothing_ids[0]]}
            
            logger.info(f"🔵 Testing Fal.ai integration with clothing ID: {self.clothing_ids[0]}")
            logger.info(f"🔵 Making request to: {self.base_url}/gerar-look-visual")
            
            response = requests.post(
                f"{self.base_url}/gerar-look-visual", 
                data=test_data, 
                headers=headers,
                timeout=60  # Longer timeout for AI processing
            )
            
            logger.info(f"🔵 Response status code: {response.status_code}")
            logger.info(f"🔵 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Log the complete response structure
                logger.info(f"🟢 FAL.AI API RESPONSE ANALYSIS:")
                logger.info(f"🟢 Response keys: {list(result.keys())}")
                logger.info(f"🟢 Full response: {json.dumps(result, indent=2, ensure_ascii=False)}")
                
                # Analyze specific fields
                if "tryon_image" in result:
                    tryon_image = result["tryon_image"]
                    if tryon_image:
                        if tryon_image.startswith("data:image"):
                            logger.info(f"🟢 tryon_image: Base64 image (length: {len(tryon_image)} chars)")
                            logger.info(f"🟢 tryon_image preview: {tryon_image[:100]}...")
                        elif tryon_image.startswith("http"):
                            logger.info(f"🟢 tryon_image: URL - {tryon_image}")
                        else:
                            logger.info(f"🟢 tryon_image: Unknown format - {tryon_image[:100]}...")
                    else:
                        logger.warning(f"🟡 tryon_image is empty or null")
                
                if "status" in result:
                    logger.info(f"🟢 Status: {result['status']}")
                
                if "api_used" in result:
                    logger.info(f"🟢 API Used: {result['api_used']}")
                
                if "note" in result:
                    logger.info(f"🟢 Note: {result['note']}")
                
                # Test with multiple clothing items
                if len(self.clothing_ids) > 1:
                    logger.info(f"🔵 Testing with multiple clothing items: {self.clothing_ids}")
                    multi_test_data = {"roupa_ids": self.clothing_ids}
                    
                    multi_response = requests.post(
                        f"{self.base_url}/gerar-look-visual", 
                        data=multi_test_data, 
                        headers=headers,
                        timeout=60
                    )
                    
                    if multi_response.status_code == 200:
                        multi_result = multi_response.json()
                        logger.info(f"🟢 Multi-item test successful")
                        logger.info(f"🟢 Multi-item response keys: {list(multi_result.keys())}")
                        logger.info(f"🟢 Multi-item clothing_items count: {len(multi_result.get('clothing_items', []))}")
                
                return {
                    "success": True,
                    "response": result,
                    "analysis": {
                        "has_tryon_image": "tryon_image" in result and result["tryon_image"] is not None,
                        "image_type": self._analyze_image_type(result.get("tryon_image")),
                        "api_used": result.get("api_used", "unknown"),
                        "status": result.get("status", "unknown"),
                        "is_fallback": result.get("api_used") == "fallback"
                    }
                }
            else:
                logger.error(f"❌ API call failed: {response.status_code}")
                logger.error(f"❌ Error response: {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "analysis": {"api_used": "failed"}
                }
                
        except Exception as e:
            logger.error(f"❌ Error testing Fal.ai integration: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "analysis": {"api_used": "error"}
            }
    
    def _analyze_image_type(self, image_data):
        """Analyze the type of image data returned"""
        if not image_data:
            return "empty"
        elif image_data.startswith("data:image"):
            return "base64"
        elif image_data.startswith("http"):
            return "url"
        else:
            return "unknown"
    
    def check_backend_logs(self):
        """Check backend logs for Fal.ai API details"""
        try:
            import subprocess
            logger.info(f"🔵 Checking backend logs for Fal.ai API calls...")
            
            # Get recent backend logs
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logs = result.stdout
                logger.info(f"🟢 Recent backend logs:")
                for line in logs.split('\n'):
                    if any(keyword in line.lower() for keyword in ['fal', 'api', 'response', 'image', 'tryon']):
                        logger.info(f"🟢 LOG: {line}")
            else:
                logger.warning(f"🟡 Could not read backend logs: {result.stderr}")
                
        except Exception as e:
            logger.warning(f"🟡 Error checking logs: {str(e)}")

def main():
    """Main test execution"""
    logger.info("🚀 Starting Fal.ai API Integration Test")
    logger.info("=" * 80)
    
    tester = FalAITester()
    
    # Step 1: Register user with body photo
    logger.info("📋 STEP 1: Registering test user with body photo")
    if not tester.register_test_user():
        logger.error("❌ Failed to register user. Aborting test.")
        return False
    
    # Step 2: Create clothing items
    logger.info("📋 STEP 2: Creating test clothing items")
    if not tester.create_test_clothing():
        logger.error("❌ Failed to create clothing items. Aborting test.")
        return False
    
    # Step 3: Test Fal.ai integration
    logger.info("📋 STEP 3: Testing Fal.ai virtual try-on integration")
    result = tester.test_fal_ai_integration()
    
    # Step 4: Check backend logs
    logger.info("📋 STEP 4: Checking backend logs")
    tester.check_backend_logs()
    
    # Final analysis
    logger.info("=" * 80)
    logger.info("🎯 FINAL ANALYSIS:")
    
    if result["success"]:
        analysis = result["analysis"]
        logger.info(f"✅ API call successful")
        logger.info(f"🔍 Has tryon_image: {analysis['has_tryon_image']}")
        logger.info(f"🔍 Image type: {analysis['image_type']}")
        logger.info(f"🔍 API used: {analysis['api_used']}")
        logger.info(f"🔍 Status: {analysis['status']}")
        logger.info(f"🔍 Is fallback mode: {analysis['is_fallback']}")
        
        if analysis['is_fallback']:
            logger.warning("🟡 IMPORTANT: API is running in fallback mode - Fal.ai not processing images")
        else:
            logger.info("🟢 GOOD: Fal.ai API appears to be processing images")
            
    else:
        logger.error(f"❌ Test failed: {result['error']}")
    
    logger.info("=" * 80)
    return result["success"]

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)