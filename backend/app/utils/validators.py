import re
from app.models.emergency_request import EmergencyLevel

def validate_coordinates(lat, lng):
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        raise ValueError("Latitude and Longitude must be valid floating point numbers.")
    
    if not (-90.0 <= lat <= 90.0):
        raise ValueError(f"Latitude must be between -90 and 90 degrees. Received {lat}")
    if not (-180.0 <= lng <= 180.0):
        raise ValueError(f"Longitude must be between -180 and 180 degrees. Received {lng}")
    return lat, lng

def validate_beds(total_beds, occupied_beds):
    try:
        total = int(total_beds)
        occupied = int(occupied_beds)
    except (ValueError, TypeError):
        raise ValueError("Total and Occupied beds must be valid integers.")
    
    if total < 0:
        raise ValueError("Total beds cannot be negative.")
    if occupied < 0:
        raise ValueError("Occupied beds cannot be negative.")
    if occupied > total:
        raise ValueError(f"Occupied beds ({occupied}) cannot exceed total beds ({total}).")
    return total, occupied

def validate_emergency_level(level):
    if not level or level.upper() not in EmergencyLevel.ALL:
        raise ValueError(f"Invalid emergency level '{level}'. Allowed values: {EmergencyLevel.ALL}")
    return level.upper()

def validate_user_id(user_id):
    if not user_id or not isinstance(user_id, str):
        raise ValueError("User ID cannot be empty.")
    user_id = user_id.strip()
    if len(user_id) < 3 or len(user_id) > 60:
        raise ValueError("User ID must be between 3 and 60 characters.")
    # Allow alphanumeric, dashes, underscores
    if not re.match(r'^[A-Za-z0-9_-]+$', user_id):
        raise ValueError("User ID can only contain letters, numbers, hyphens, and underscores.")
    return user_id

def validate_password(password):
    if not password or not isinstance(password, str):
        raise ValueError("Password cannot be empty.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters long.")
    return password

def validate_phone(phone):
    if not phone or not isinstance(phone, str):
        raise ValueError("Phone number cannot be empty.")
    phone = phone.strip()
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    if not (7 <= len(cleaned) <= 15) or not cleaned.isdigit():
        raise ValueError("Phone number must contain between 7 and 15 digits.")
    return phone
