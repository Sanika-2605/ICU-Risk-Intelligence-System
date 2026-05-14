"""
============================================
Auth Routes
============================================
Blueprint: /api/auth
Public endpoints — no JWT required.
"""

from flask import Blueprint
from controllers.auth_controller import handle_register, handle_login

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (doctor, nurse, or admin)."""
    return handle_register()


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate and receive a JWT access token."""
    return handle_login()
