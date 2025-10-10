#!/usr/bin/env python3
"""
Direct test of Fal.ai API to understand the exact requirements
"""

import requests
import json
import os

# Fal.ai API configuration
FAL_API_KEY = "e6f13f85-b293-4197-9412-11d9947cf7b5:78f494fb71ef1bff59badf506b514aeb"
FAL_API_URL = "https://fal.run/fal-ai/fashn/tryon/v1.5"

def test_fal_api_with_urls():
    """Test Fal.ai API with public image URLs"""
    print("🧪 Testing Fal.ai API directly with public image URLs")
    print("=" * 50)
    
    # Use public test images
    payload = {
        "model_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",  # Person photo
        "garment_image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop",  # T-shirt
        "description": "Virtual try-on test with public images"
    }
    
    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"📡 Calling Fal.ai API: {FAL_API_URL}")
        print(f"🔑 API Key: {FAL_API_KEY[:20]}...")
        print(f"📋 Payload keys: {list(payload.keys())}")
        
        response = requests.post(FAL_API_URL, json=payload, headers=headers, timeout=60)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: Fal.ai API working!")
            print(f"📋 Response keys: {list(result.keys())}")
            
            if "image" in result:
                image_info = result["image"]
                print(f"🖼️  Generated image: {image_info}")
            
            return True
            
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
            # Check for specific error types
            if response.status_code == 401:
                print("🔑 Authentication issue - check API key")
            elif response.status_code == 403:
                print("💳 Balance/permission issue")
            elif response.status_code == 422:
                print("📝 Payload format issue")
            elif response.status_code == 400:
                print("🖼️  Image format/loading issue")
            
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_fal_api_with_base64():
    """Test Fal.ai API with base64 images"""
    print("\n🧪 Testing Fal.ai API with base64 images")
    print("=" * 50)
    
    # Create a proper base64 image (1x1 pixel PNG)
    base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    payload = {
        "model_image": base64_image,
        "garment_image": base64_image,
        "description": "Virtual try-on test with base64 images"
    }
    
    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"📡 Calling Fal.ai API with base64 images")
        
        response = requests.post(FAL_API_URL, json=payload, headers=headers, timeout=60)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: Base64 images work!")
            return True
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    """Main test execution"""
    print("🎯 DIRECT FAL.AI API TEST")
    print("Testing to understand exact API requirements")
    print("=" * 60)
    
    # Test 1: Public URLs
    url_success = test_fal_api_with_urls()
    
    # Test 2: Base64 (if URL test fails)
    if not url_success:
        base64_success = test_fal_api_with_base64()
    
    print("\n" + "=" * 60)
    print("🏁 DIRECT API TEST SUMMARY")
    print("=" * 60)
    
    if url_success:
        print("✅ Fal.ai API is working with public URLs")
        print("💡 Recommendation: Use public image URLs in backend")
    else:
        print("❌ Fal.ai API issues detected")
        print("💡 Check API key, balance, or image format requirements")

if __name__ == "__main__":
    main()