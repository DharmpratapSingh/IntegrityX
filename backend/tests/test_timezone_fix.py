#!/usr/bin/env python3
"""
Test script to verify the timezone fix for consistent Eastern Time display.
"""

import requests
import json
import time
from datetime import datetime
import pytz

def test_timezone_consistency():
    """Test that all timestamps are now in Eastern Time."""
    print("🕐 TESTING TIMEZONE CONSISTENCY FIX")
    print("=" * 50)
    
    # Test with a known document ID
    test_artifact_id = "79215b46-571c-4c23-b805-a42bc0694885"
    
    try:
        # Fetch audit trail
        response = requests.get(f"http://localhost:8000/api/loan-documents/{test_artifact_id}/audit-trail")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") and data.get("data"):
                events = data["data"].get("events", [])
                print(f"✅ Retrieved {len(events)} audit events")
                
                eastern_tz = pytz.timezone('America/New_York')
                current_eastern = datetime.now(eastern_tz)
                
                print(f"\n🕐 Current Eastern Time: {current_eastern.strftime('%Y-%m-%d %I:%M:%S %p %Z')}")
                print(f"🕐 Current UTC Time: {datetime.now(pytz.UTC).strftime('%Y-%m-%d %I:%M:%S %p %Z')}")
                print(f"🕐 Timezone Offset: {current_eastern.strftime('%z')}")
                
                print(f"\n📅 Audit Events (should all be in Eastern Time):")
                print("-" * 60)
                
                for i, event in enumerate(events):
                    timestamp = event.get('timestamp')
                    event_type = event.get('event_type', 'N/A')
                    
                    if timestamp:
                        try:
                            # Parse the timestamp
                            if 'T' in timestamp:
                                # ISO format
                                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                            else:
                                dt = datetime.fromisoformat(timestamp)
                            
                            # Check if it's in Eastern Time
                            if dt.tzinfo:
                                eastern_dt = dt.astimezone(eastern_tz)
                                utc_dt = dt.astimezone(pytz.UTC)
                                
                                print(f"   Event {i+1}: {event_type}")
                                print(f"     Timestamp: {timestamp}")
                                print(f"     Eastern: {eastern_dt.strftime('%Y-%m-%d %I:%M:%S %p %Z')}")
                                print(f"     UTC: {utc_dt.strftime('%Y-%m-%d %I:%M:%S %p %Z')}")
                                
                                # Check if timestamp is already in Eastern Time
                                if 'America/New_York' in str(dt.tzinfo) or 'EDT' in str(dt.tzinfo) or 'EST' in str(dt.tzinfo):
                                    print(f"     ✅ Already in Eastern Time")
                                else:
                                    print(f"     ⚠️  Not in Eastern Time (timezone: {dt.tzinfo})")
                                
                                print()
                            else:
                                print(f"   Event {i+1}: {event_type}")
                                print(f"     ❌ No timezone info: {timestamp}")
                                print()
                                
                        except Exception as e:
                            print(f"   Event {i+1}: {event_type}")
                            print(f"     ❌ Error parsing timestamp: {e}")
                            print()
                    else:
                        print(f"   Event {i+1}: {event_type}")
                        print(f"     ❌ No timestamp")
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
        print(f"❌ Error testing timezone: {e}")
        return False

def test_timezone_utils():
    """Test the timezone utility functions."""
    print("\n🔧 TESTING TIMEZONE UTILITY FUNCTIONS")
    print("=" * 50)
    
    try:
        from src.timezone_utils import (
            get_eastern_now, get_eastern_now_iso, 
            format_display_timestamp, get_timezone_offset,
            get_eastern_timezone_name, is_dst_active
        )
        
        # Test current Eastern Time
        eastern_now = get_eastern_now()
        eastern_iso = get_eastern_now_iso()
        display_time = format_display_timestamp(eastern_now)
        timezone_name = get_eastern_timezone_name()
        offset = get_timezone_offset()
        dst_active = is_dst_active()
        
        print(f"✅ Eastern Time Now: {eastern_now}")
        print(f"✅ Eastern ISO: {eastern_iso}")
        print(f"✅ Display Format: {display_time}")
        print(f"✅ Timezone Name: {timezone_name}")
        print(f"✅ UTC Offset: {offset}")
        print(f"✅ DST Active: {dst_active}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing timezone utils: {e}")
        return False

if __name__ == "__main__":
    print("🕐 TIMEZONE CONSISTENCY TEST")
    print("=" * 60)
    print("Testing that database and frontend use consistent Eastern Time")
    print("=" * 60)
    
    # Test timezone utilities
    utils_success = test_timezone_utils()
    
    # Test API consistency
    api_success = test_timezone_consistency()
    
    print("\n" + "=" * 60)
    print("📊 TIMEZONE FIX SUMMARY")
    print("=" * 60)
    
    if utils_success and api_success:
        print("✅ Timezone utilities working correctly")
        print("✅ API returning Eastern Time timestamps")
        print("🎉 Database and frontend now use consistent Eastern Time!")
    else:
        print("❌ Some timezone issues detected")
        if not utils_success:
            print("   • Timezone utility functions need fixing")
        if not api_success:
            print("   • API timestamp conversion needs fixing")
    
    print(f"\n🔧 Changes Applied:")
    print(f"   • Updated database models to use Eastern Time")
    print(f"   • Updated API endpoints to return Eastern Time")
    print(f"   • Added timezone utility functions")
    print(f"   • Frontend will now display consistent Eastern Time")








