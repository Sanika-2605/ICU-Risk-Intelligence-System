"""
============================================
ICU Risk Intelligence System — Application Entry Point
============================================
Flask application factory with:
  • SQLAlchemy ORM initialization
  • JWT authentication setup
  • CORS configuration
  • Blueprint registration
  • Global error handlers
  • Automatic database seeding

Usage:
    python app.py
"""

import os
import sys
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)

# ── Ensure the backend directory is on sys.path ────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import get_config
from database import db


# ════════════════════════════════════════════════════════════════════
#  Application Factory
# ════════════════════════════════════════════════════════════════════

def create_app(config_class=None):
    """
    Create and configure the Flask application.

    Args:
        config_class: Optional config class override.
                      Defaults to auto-detection via FLASK_ENV.

    Returns:
        Configured Flask app instance.
    """
    app = Flask(__name__)

    # ── Load configuration ──────────────────────────────────────────
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    # ── Initialize extensions ───────────────────────────────────────
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt = JWTManager(app)

    # ── JWT error handlers ──────────────────────────────────────────
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Access token has expired. Please login again.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': f'Invalid token: {error}'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Authorization token is missing. Please include a valid Bearer token.'
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has been revoked.'
        }), 401

    # ── Register blueprints ─────────────────────────────────────────
    from routes.auth_routes import auth_bp
    from routes.patient_routes import patient_bp
    from routes.prediction_routes import prediction_bp
    from routes.alert_routes import alert_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.analytics_routes import analytics_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(alert_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analytics_bp)

    # ── Global error handlers ───────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'message': 'Bad request. Please check your input.'
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'success': False,
            'message': 'Unauthorized. Please provide valid credentials.'
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'success': False,
            'message': 'Forbidden. You do not have access to this resource.'
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Resource not found. Please check the URL.'
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'message': 'HTTP method not allowed for this endpoint.'
        }), 405

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error. Please try again later.'
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.error(f'Unhandled exception: {error}')
        return jsonify({
            'success': False,
            'message': f'An unexpected error occurred: {str(error)}'
        }), 500

    # ── Health check / root endpoint ────────────────────────────────
    @app.route('/')
    def health_check():
        return jsonify({
            'success': True,
            'message': 'ICU Risk Intelligence System API is running',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'patients': '/api/patient',
                'predictions': '/api/predictions',
                'alerts': '/api/alerts',
                'dashboard': '/api/dashboard',
                'analytics': '/api/analytics',
            }
        })

    # ── Create tables & seed on first request ───────────────────────
    with app.app_context():
        # Import all models so SQLAlchemy sees them
        import models  # noqa: F401

        db.create_all()

        # Seed sample data
        from database.seed import seed_database
        seed_database()

    return app


# ════════════════════════════════════════════════════════════════════
#  Run
# ════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
    )
