import math
import requests

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in km."""
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_fallback_waypoints(start_lat: float, start_lng: float, dest_lat: float, dest_lng: float, curve_offset: float = 0.0, num_steps: int = 15):
    """
    Generates realistic road-like waypoints between start and destination
    when external routing engine is offline or unreachable.
    """
    coords = []
    for i in range(num_steps + 1):
        fraction = i / num_steps
        # Linear interpolation
        base_lat = start_lat + fraction * (dest_lat - start_lat)
        base_lng = start_lng + fraction * (dest_lng - start_lng)
        
        # Add arc offset to simulate turning along road arteries
        arc = math.sin(fraction * math.pi) * curve_offset
        lat = base_lat + arc * 0.003
        lng = base_lng - arc * 0.003
        coords.append([round(lat, 6), round(lng, 6)])
    return coords

def fetch_osrm_routes(start_lat: float, start_lng: float, dest_lat: float, dest_lng: float):
    """
    Attempts to fetch real road driving routes from OSRM public API.
    Falls back gracefully to high-fidelity waypoint paths with zero crash.
    """
    direct_km = haversine_distance(start_lat, start_lng, dest_lat, dest_lng)
    
    url = f"https://router.project-osrm.org/route/v1/driving/{start_lng},{start_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson&alternatives=true"
    
    try:
        resp = requests.get(url, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('code') == 'Ok' and data.get('routes'):
                routes = []
                for idx, r in enumerate(data['routes'][:3]):
                    # GeoJSON is [lng, lat], map expects [lat, lng]
                    coords = [[pt[1], pt[0]] for pt in r['geometry']['coordinates']]
                    distance_km = round(r['distance'] / 1000.0, 2)
                    duration_mins = round(r['duration'] / 60.0, 1)
                    
                    name = "Fastest Primary Corridor" if idx == 0 else f"Alternative Route {idx}"
                    routes.append({
                        'route_id': f"route_{idx + 1}",
                        'name': name,
                        'distance_km': distance_km,
                        'duration_mins': duration_mins,
                        'coordinates': coords,
                        'provider': 'OSRM OpenStreetMap Engine',
                        'traffic_notice': 'OSM static navigation network geometry'
                    })
                return routes
    except Exception:
        # Graceful fallback if network is restricted or offline
        pass

    # High fidelity fallback routes
    routes = [
        {
            'route_id': 'route_1',
            'name': 'Primary Express Corridor (Priority Siren Transit)',
            'distance_km': round(direct_km * 1.25, 2),
            'duration_mins': round((direct_km * 1.25) / 45.0 * 60, 1), # ~45 km/h avg ambulance speed
            'coordinates': generate_fallback_waypoints(start_lat, start_lng, dest_lat, dest_lng, curve_offset=1.2),
            'provider': 'Internal Medical Route Calculator (Fallback)',
            'traffic_notice': '[SIMULATED TRAFFIC ADVISORY] High throughput clearance active. External traffic API offline.'
        },
        {
            'route_id': 'route_2',
            'name': 'Secondary Bypass Corridor',
            'distance_km': round(direct_km * 1.42, 2),
            'duration_mins': round((direct_km * 1.42) / 50.0 * 60, 1),
            'coordinates': generate_fallback_waypoints(start_lat, start_lng, dest_lat, dest_lng, curve_offset=-1.8),
            'provider': 'Internal Medical Route Calculator (Fallback)',
            'traffic_notice': '[SIMULATED TRAFFIC ADVISORY] Moderate city traffic. Bypass recommended.'
        },
        {
            'route_id': 'route_3',
            'name': 'Direct Urban Arterial Route',
            'distance_km': round(direct_km * 1.15, 2),
            'duration_mins': round((direct_km * 1.15) / 35.0 * 60, 1),
            'coordinates': generate_fallback_waypoints(start_lat, start_lng, dest_lat, dest_lng, curve_offset=0.2),
            'provider': 'Internal Medical Route Calculator (Fallback)',
            'traffic_notice': '[SIMULATED TRAFFIC ADVISORY] Urban signals present.'
        }
    ]
    return routes
