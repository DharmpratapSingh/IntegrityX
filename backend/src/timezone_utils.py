"""
Timezone utilities for consistent Eastern Time handling.

This module provides utilities to ensure all timestamps are stored and displayed
in Eastern Time (EDT/EST) consistently across the entire system.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
import pytz

# Eastern Time zone
EASTERN_TZ = pytz.timezone('America/New_York')

def get_eastern_now() -> datetime:
    """
    Get current time in Eastern Time zone.
    
    Returns:
        datetime: Current time in Eastern Time (EDT/EST)
    """
    return datetime.now(EASTERN_TZ)

def get_eastern_now_iso() -> str:
    """
    Get current time in Eastern Time zone as ISO string.
    
    Returns:
        str: Current time in Eastern Time as ISO string
    """
    return get_eastern_now().isoformat()

def utc_to_eastern(utc_dt: datetime) -> datetime:
    """
    Convert UTC datetime to Eastern Time.
    
    Args:
        utc_dt: UTC datetime object
        
    Returns:
        datetime: Eastern Time datetime
    """
    if utc_dt.tzinfo is None:
        # Assume UTC if no timezone info
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    
    return utc_dt.astimezone(EASTERN_TZ)

def eastern_to_utc(eastern_dt: datetime) -> datetime:
    """
    Convert Eastern Time datetime to UTC.
    
    Args:
        eastern_dt: Eastern Time datetime object
        
    Returns:
        datetime: UTC datetime
    """
    if eastern_dt.tzinfo is None:
        # Assume Eastern if no timezone info
        eastern_dt = EASTERN_TZ.localize(eastern_dt)
    
    return eastern_dt.astimezone(timezone.utc)

def format_eastern_time(dt: datetime, format_str: str = None) -> str:
    """
    Format datetime in Eastern Time.
    
    Args:
        dt: Datetime object
        format_str: Optional format string
        
    Returns:
        str: Formatted Eastern Time string
    """
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        dt = dt.replace(tzinfo=timezone.utc)
    
    eastern_dt = dt.astimezone(EASTERN_TZ)
    
    if format_str:
        return eastern_dt.strftime(format_str)
    else:
        return eastern_dt.strftime("%b %d, %Y, %I:%M:%S %p %Z")

def get_eastern_timezone_name() -> str:
    """
    Get the current Eastern Time zone name (EDT or EST).
    
    Returns:
        str: Current timezone name (EDT or EST)
    """
    now = get_eastern_now()
    return now.strftime("%Z")

def is_dst_active() -> bool:
    """
    Check if Daylight Saving Time is currently active in Eastern Time.
    
    Returns:
        bool: True if DST is active (EDT), False if standard time (EST)
    """
    now = get_eastern_now()
    return now.dst() != timedelta(0)

def get_timezone_offset() -> str:
    """
    Get the current timezone offset from UTC.
    
    Returns:
        str: Timezone offset (e.g., "-04:00" for EDT, "-05:00" for EST)
    """
    now = get_eastern_now()
    offset = now.strftime("%z")
    return f"{offset[:3]}:{offset[3:]}"

# Database model helper functions
def eastern_datetime_default():
    """
    Default function for SQLAlchemy DateTime columns to use Eastern Time.
    
    Returns:
        datetime: Current time in Eastern Time
    """
    return get_eastern_now()

def eastern_datetime_utc_default():
    """
    Default function for SQLAlchemy DateTime columns that stores Eastern Time as UTC.
    This is useful for database consistency while maintaining Eastern Time semantics.
    
    Returns:
        datetime: Current Eastern Time converted to UTC for storage
    """
    eastern_now = get_eastern_now()
    return eastern_to_utc(eastern_now)

# API response formatting
def format_api_timestamp(dt: datetime) -> str:
    """
    Format datetime for API responses in Eastern Time.
    
    Args:
        dt: Datetime object
        
    Returns:
        str: Formatted timestamp for API responses
    """
    return format_eastern_time(dt, "%Y-%m-%dT%H:%M:%S.%f")

def format_display_timestamp(dt: datetime) -> str:
    """
    Format datetime for display in Eastern Time.
    
    Args:
        dt: Datetime object
        
    Returns:
        str: Formatted timestamp for display
    """
    return format_eastern_time(dt, "%b %d, %Y, %I:%M:%S %p %Z")

# Timezone conversion utilities for existing data
def convert_utc_to_eastern_iso(utc_iso_string: str) -> str:
    """
    Convert UTC ISO string to Eastern Time ISO string.
    
    Args:
        utc_iso_string: UTC ISO datetime string
        
    Returns:
        str: Eastern Time ISO string
    """
    try:
        utc_dt = datetime.fromisoformat(utc_iso_string.replace('Z', '+00:00'))
        eastern_dt = utc_to_eastern(utc_dt)
        return eastern_dt.isoformat()
    except Exception:
        return utc_iso_string  # Return original if conversion fails

def convert_eastern_to_utc_iso(eastern_iso_string: str) -> str:
    """
    Convert Eastern Time ISO string to UTC ISO string.
    
    Args:
        eastern_iso_string: Eastern Time ISO datetime string
        
    Returns:
        str: UTC ISO string
    """
    try:
        eastern_dt = datetime.fromisoformat(eastern_iso_string)
        if eastern_dt.tzinfo is None:
            eastern_dt = EASTERN_TZ.localize(eastern_dt)
        utc_dt = eastern_to_utc(eastern_dt)
        return utc_dt.isoformat()
    except Exception:
        return eastern_iso_string  # Return original if conversion fails






