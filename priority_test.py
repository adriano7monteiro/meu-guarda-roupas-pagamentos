#!/usr/bin/env python3
"""
PRIORITY TEST: Virtual Try-on after Fal.ai Credit Addition
Focus: Testing POST /api/gerar-look-visual to verify real AI generation
"""

import requests
import json
import base64
from datetime import datetime

# Backend URL
BACKEND_URL = "https://wardrobepush.preview.emergentagent.com/api"

def create_test_image():
    """Create a simple test image in base64 format"""
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEAPwA/wA=="

def test_virtual_tryon_priority():
    """Priority test for virtual try-on endpoint"""
    print("🎯 PRIORITY TEST: Virtual Try-on after Fal.ai Credit Addition")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Step 1: Register/Login user
    print("1️⃣ Setting up test user...")
    user_email = f"priority_test_{datetime.now().strftime('%H%M%S')}@test.com"
    
    register_data = {
        "email": user_email,
        "password": "TestPass123!",
        "nome": "Priority Test User",
        "ocasiao_preferida": "casual"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=register_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data["token"]
            print(f"✅ User registered: {user_email}")
        else:
            print(f"❌ Registration failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Upload body photo
    print("2️⃣ Uploading body photo...")
    body_data = {"imagem": create_test_image()}
    
    try:
        response = requests.post(f"{BACKEND_URL}/upload-foto-corpo", data=body_data, headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ Body photo uploaded")
        else:
            print(f"❌ Body photo upload failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Body photo error: {e}")
        return False
    
    # Step 3: Upload clothing
    print("3️⃣ Uploading test clothing...")
    clothing_data = {
        "tipo": "camiseta",
        "cor": "azul",
        "estilo": "casual",
        "nome": "Camiseta Teste Virtual Try-on",
        "imagem_original": create_test_image()
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/upload-roupa", json=clothing_data, headers=headers, timeout=10)
        if response.status_code == 200:
            clothing_id = response.json()["id"]
            print(f"✅ Clothing uploaded: {clothing_id}")
        else:
            print(f"❌ Clothing upload failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Clothing upload error: {e}")
        return False
    
    # Step 4: PRIORITY TEST - Virtual Try-on
    print("4️⃣ 🎯 TESTING VIRTUAL TRY-ON ENDPOINT (PRIORITY)")
    print("-" * 50)
    
    tryon_data = {"roupa_ids": [clothing_id]}
    
    try:
        print(f"📡 Calling POST /api/gerar-look-visual with clothing ID: {clothing_id}")
        response = requests.post(f"{BACKEND_URL}/gerar-look-visual", data=tryon_data, headers=headers, timeout=60)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n📋 RESPONSE ANALYSIS:")
            print("-" * 30)
            
            # Key indicators
            api_used = result.get("api_used", "unknown")
            message = result.get("message", "")
            status = result.get("status", "")
            tryon_image = result.get("tryon_image", "")
            note = result.get("note", "")
            
            print(f"🔧 API Used: {api_used}")
            print(f"📝 Message: {message}")
            print(f"📊 Status: {status}")
            print(f"🖼️  Try-on Image: {'Present' if tryon_image else 'Missing'}")
            if note:
                print(f"📄 Note: {note}")
            
            print("\n🎯 PRIORITY TEST RESULTS:")
            print("-" * 30)
            
            if api_used == "fal.ai-fashn":
                print("✅ SUCCESS: Fal.ai API is working!")
                print("✅ Real AI image generation confirmed")
                print("✅ Credit addition was successful")
                
                if tryon_image and tryon_image != "":
                    print("✅ Generated image URL/data present")
                else:
                    print("⚠️  Warning: No image data in response")
                
                return True
                
            elif api_used == "fallback":
                print("❌ PROBLEM: Still using fallback mode")
                print("❌ Fal.ai API not working properly")
                
                if "403" in note or "balance" in note.lower() or "exhausted" in note.lower():
                    print("❌ CRITICAL: Still showing balance/403 errors")
                    print("💡 Suggestion: Check if credit was actually added to Fal.ai account")
                else:
                    print(f"❌ Other API issue: {note}")
                
                return False
                
            else:
                print(f"❌ UNKNOWN: Unexpected API status: {api_used}")
                return False
                
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during virtual try-on test: {e}")
        return False

def main():
    """Main test execution"""
    success = test_virtual_tryon_priority()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 PRIORITY TEST PASSED: Fal.ai integration working!")
        print("✅ Virtual try-on generating real AI images")
    else:
        print("💥 PRIORITY TEST FAILED: Issues with Fal.ai integration")
        print("❌ Still using fallback or other problems")
    print("=" * 60)
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())