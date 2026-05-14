"""
============================================
Authentication Middleware
============================================
JWT verification and role-based access control
decorators for protecting API endpoints.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.user import User
from utils.response import error_response


def jwt_required_custom(fn):
    """
    Decorator that verifies a valid JWT is present in the request.
    Attaches the current user to the function kwargs.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)

            if not current_user:
                return error_response('User not found', 404)

            kwargs['current_user'] = current_user
            return fn(*args, **kwargs)

        except Exception as e:
            return error_response(f'Authentication failed: {str(e)}', 401)

    return wrapper


def role_required(*allowed_roles):
    """
    Decorator factory that restricts access to users with
    specific roles.

    Usage:
        @role_required('doctor', 'admin')
        def my_endpoint(current_user=None):
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                current_user = User.query.get(current_user_id)

                if not current_user:
                    return error_response('User not found', 404)

                if current_user.role not in allowed_roles:
                    return error_response(
                        f'Access denied. Required role(s): {", ".join(allowed_roles)}',
                        403
                    )

                kwargs['current_user'] = current_user
                return fn(*args, **kwargs)

            except Exception as e:
                return error_response(f'Authentication failed: {str(e)}', 401)

        return wrapper
    return decorator
