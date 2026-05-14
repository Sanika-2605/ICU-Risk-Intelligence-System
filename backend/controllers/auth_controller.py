"""
============================================
Auth Controller
============================================
Handles HTTP request/response for authentication
endpoints. Delegates business logic to auth_service.
"""

from flask import request
from services.auth_service import register_user, login_user
from utils.response import success_response, error_response


def handle_register():
    """
    POST /api/auth/register

    Body: { name, email, password, role? }
    """
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    success, result = register_user(data)

    if success:
        return success_response(
            'User registered successfully',
            data=result,
            status_code=201
        )
    else:
        return error_response(result, 400)


def handle_login():
    """
    POST /api/auth/login

    Body: { email, password }
    """
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    success, result = login_user(data)

    if success:
        return success_response(
            'Login successful',
            data=result,
            status_code=200
        )
    else:
        return error_response(result, 401)
