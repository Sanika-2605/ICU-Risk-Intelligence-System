"""
============================================
Authentication Service
============================================
Business logic for user registration and login.
"""

from flask_jwt_extended import create_access_token
from database import db
from models.user import User
from utils.validators import validate_registration, validate_login


def register_user(data: dict) -> tuple:
    """
    Register a new user.

    Returns:
        (success: bool, result: dict | str)
    """
    # Validate input
    is_valid, errors = validate_registration(data)
    if not is_valid:
        return False, '; '.join(errors)

    # Check duplicate email
    if User.query.filter_by(email=data['email'].lower().strip()).first():
        return False, 'Email already registered'

    # Create user
    user = User(
        name=data['name'].strip(),
        email=data['email'].lower().strip(),
        role=data.get('role', 'nurse').lower(),
    )
    user.set_password(data['password'])

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, f'Database error: {str(e)}'

    return True, user.to_dict()


def login_user(data: dict) -> tuple:
    """
    Authenticate a user and issue a JWT.

    Returns:
        (success: bool, result: dict | str)
    """
    # Validate input
    is_valid, errors = validate_login(data)
    if not is_valid:
        return False, '; '.join(errors)

    user = User.query.filter_by(email=data['email'].lower().strip()).first()

    if not user or not user.check_password(data['password']):
        return False, 'Invalid email or password'

    # Generate JWT with user id as identity
    access_token = create_access_token(identity=str(user.id))

    return True, {
        'access_token': access_token,
        'user': user.to_dict(),
    }
