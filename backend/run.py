import os
from app import create_app
from app.extensions import socketio

app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"[*] MEDTRACK Emergency Coordination Server running on http://{host}:{port}")
    socketio.run(app, host=host, port=port, debug=debug_mode, use_reloader=False, allow_unsafe_werkzeug=True)
