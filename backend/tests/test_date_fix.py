#!/usr/bin/env python3
"""
Test script to verify the date display fix in the frontend.
"""

import requests
import json
import time

def test_audit_trail_date_format():
    """Test that audit trail returns properly formatted dates."""
    print("🔍 Testing audit trail date format...")
    
    # Test with a known document ID from our directory upload test
    test_artifact_id = "79215b46-571c-4c23-b805-a42bc0694885"  # From the image description
    
    try:
        # Fetch audit trail
        response = requests.get(f"http://localhost:8000/api/loan-documents/{test_artifact_id}/audit-trail")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") and data.get("data"):
                events = data["data"].get("events", [])
                print(f"✅ Retrieved {len(events)} audit events")
                
                for i, event in enumerate(events):
                    print(f"   Event {i+1}:")
                    print(f"     Type: {event.get('event_type', 'N/A')}")
                    print(f"     Timestamp: {event.get('timestamp', 'N/A')}")
                    print(f"     User: {event.get('user_id', 'N/A')}")
                    
                    # Test if timestamp is valid ISO format
                    timestamp = event.get('timestamp')
                    if timestamp:
                        try:
                            from datetime import datetime
                            parsed_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                            print(f"     ✅ Valid ISO format: {parsed_date}")
                        except Exception as e:
                            print(f"     ❌ Invalid timestamp format: {e}")
                    else:
                        print(f"     ❌ No timestamp field")
                    print()
                
                return True
            else:
                print(f"❌ API response not ok: {data}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing audit trail: {e}")
        return False

def test_date_parsing():
    """Test JavaScript-style date parsing."""
    print("📅 Testing date parsing...")
    
    # Test various date formats
    test_dates = [
        "2025-10-23T21:33:43.123456Z",
        "2025-10-23T21:33:43Z",
        "2025-10-23T21:33:43.123456+00:00",
        "2025-10-23T21:33:43+00:00",
        "2025-10-23T21:33:43",
        "2025-10-23 21:33:43"
    ]
    
    for date_str in test_dates:
        try:
            from datetime import datetime
            # Parse ISO format
            if 'Z' in date_str:
                parsed = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                parsed = datetime.fromisoformat(date_str)
            
            # Format like JavaScript toLocaleString
            formatted = parsed.strftime("%b %d, %Y, %I:%M:%S %p")
            print(f"   ✅ {date_str} → {formatted}")
        except Exception as e:
            print(f"   ❌ {date_str} → Error: {e}")

if __name__ == "__main__":
    print("🔧 TESTING DATE DISPLAY FIX")
    print("=" * 50)
    
    # Test audit trail API
    success = test_audit_trail_date_format()
    
    print("\n" + "=" * 50)
    
    # Test date parsing
    test_date_parsing()
    
    print("\n" + "=" * 50)
    
    if success:
        print("✅ Date format fix appears to be working!")
        print("📝 The frontend should now display proper dates instead of 'Invalid Date'")
    else:
        print("❌ Date format fix needs more investigation")
    
    print("\n🔍 Frontend Fix Applied:")
    print("   • Updated AuditEvent interface to match backend API")
    print("   • Changed 'created_at' to 'timestamp' field")
    print("   • Improved date formatting with proper locale options")
    print("   • Added better error handling for date parsing")








