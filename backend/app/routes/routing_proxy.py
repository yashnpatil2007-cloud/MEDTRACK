from flask import Blueprint, request, jsonify
from app.utils.validators import validate_coordinates
from app.services.routing_service import fetch_osrm_routes

routing_bp = Blueprint('routing', __name__, url_prefix='/api')

@routing_bp.route('/routes/calculate', methods=['GET'])
def calculate_routes():
    """
    Calculates driving routes between coordinates using OSRM OpenStreetMap engine.
    Returns primary and alternate paths with explicit disclosures.
    """
    start_lat = request.args.get('start_lat')
    start_lng = request.args.get('start_lng')
    dest_lat = request.args.get('dest_lat')
    dest_lng = request.args.get('dest_lng')

    if not all([start_lat, start_lng, dest_lat, dest_lng]):
        return jsonify({'success': False, 'message': 'start_lat, start_lng, dest_lat, and dest_lng are required.'}), 400

    try:
        s_lat, s_lng = validate_coordinates(start_lat, start_lng)
        d_lat, d_lng = validate_coordinates(dest_lat, dest_lng)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    routes = fetch_osrm_routes(s_lat, s_lng, d_lat, d_lng)

    return jsonify({
        'success': True,
        'count': len(routes),
        'routes': routes,
        'disclosure': {
            'map_tiles': 'OpenStreetMap Cartography (c) OpenStreetMap contributors',
            'routing_engine': 'OSRM (Open Source Routing Machine)',
            'traffic_disclaimer': 'OpenStreetMap does not provide native real-time crowd-sourced probe telemetry. Traffic advisory notices shown are modeled priority clearance simulations.'
        }
    }), 200
