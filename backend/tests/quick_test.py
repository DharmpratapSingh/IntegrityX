"""
Quick test script to check IntegrityX server status and basic functionality
"""

import requests
import json
import time

def test_server_status():
    """Test if the server is running and responding."""
    try:
        # Test health endpoint
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and healthy")
            return True
        else:
            print(f"❌ Server responded with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running or not accessible")
        return False
    except requests.exceptions.Timeout:
        print("❌ Server request timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing server: {e}")
        return False

def test_basic_endpoints():
    """Test basic API endpoints."""
    endpoints_to_test = [
        ("/api/analytics/system-metrics", "System Metrics"),
        ("/api/signing/providers", "Signing Providers"),
        ("/api/signing/templates", "Signing Templates"),
        ("/api/ai/document-types", "AI Document Types"),
        ("/api/ai/ai-capabilities", "AI Capabilities")
    ]
    
    results = {}
    
    for endpoint, name in endpoints_to_test:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {name}: Working")
                results[name] = True
            else:
                print(f"❌ {name}: Failed (Status: {response.status_code})")
                results[name] = False
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            results[name] = False
    
    return results

def main():
    """Main test function."""
    print("🧪 IntegrityX Quick Test")
    print("=" * 30)
    
    # Test server status
    if not test_server_status():
        print("\n💡 To start the server, run:")
        print("   python start_server.py")
        return
    
    print("\n🧪 Testing Basic Endpoints")
    print("-" * 30)
    
    # Test basic endpoints
    results = test_basic_endpoints()
    
    # Summary
    successful = sum(results.values())
    total = len(results)
    
    print(f"\n📊 Results: {successful}/{total} endpoints working")
    
    if successful == total:
        print("🎉 All endpoints are working perfectly!")
    elif successful > total // 2:
        print("⚠️ Most endpoints are working, some issues detected.")
    else:
        print("❌ Multiple endpoints are not working.")

if __name__ == "__main__":
    main()



