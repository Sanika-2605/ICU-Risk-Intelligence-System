"""
============================================
Response Helpers
============================================
Standardized JSON response builders for
consistent API output format.
"""

from flask import jsonify


def success_response(message: str, data=None, status_code: int = 200):
    """
    Build a standardized success JSON response.

    Args:
        message:     Human-readable success message
        data:        Optional payload (dict, list, or scalar)
        status_code: HTTP status code (default 200)

    Returns:
        Flask Response with JSON body
    """
    payload = {
        'success': True,
        'message': message,
    }
    if data is not None:
        payload['data'] = data

    return jsonify(payload), status_code


def error_response(message: str, status_code: int = 400):
    """
    Build a standardized error JSON response.

    Args:
        message:     Human-readable error description
        status_code: HTTP status code (default 400)

    Returns:
        Flask Response with JSON body
    """
    payload = {
        'success': False,
        'message': message,
    }
    return jsonify(payload), status_code
