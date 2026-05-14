"""
============================================
Input Validators
============================================
Medical-grade validation for ICU patient data
and user registration inputs.
"""

import re

# ── Medical limits ──────────────────────────────────────────────────
VITAL_LIMITS = {
    'age':              {'min': 0,    'max': 150,   'unit': 'years'},
    'heart_rate':       {'min': 20,   'max': 300,   'unit': 'bpm'},
    'spo2':             {'min': 0,    'max': 100,   'unit': '%'},
    'temperature':      {'min': 25.0, 'max': 45.0,  'unit': '°C'},
    'respiratory_rate': {'min': 5,    'max': 60,    'unit': 'breaths/min'},
}

VALID_ROLES = {'doctor', 'nurse', 'admin'}


def validate_patient_data(data: dict) -> tuple:
    """
    Validate patient vital signs against medical limits.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []

    # Required fields
    required_fields = [
        'patient_id', 'age', 'heart_rate', 'blood_pressure',
        'spo2', 'temperature', 'respiratory_rate'
    ]
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            errors.append(f'Missing required field: {field}')

    if errors:
        return False, errors

    # ── Numeric range checks ────────────────────────────────────────
    for field, limits in VITAL_LIMITS.items():
        try:
            value = float(data[field])
            if value < limits['min'] or value > limits['max']:
                errors.append(
                    f"Invalid {field}: {value}. "
                    f"Must be between {limits['min']} and {limits['max']} {limits['unit']}"
                )
        except (ValueError, TypeError):
            errors.append(f'{field} must be a numeric value')

    # ── Blood pressure format ───────────────────────────────────────
    bp = str(data.get('blood_pressure', ''))
    bp_pattern = re.compile(r'^\d{2,3}/\d{2,3}$')
    if not bp_pattern.match(bp):
        errors.append(
            'blood_pressure must be in format "systolic/diastolic" (e.g. "120/80")'
        )
    else:
        systolic, diastolic = bp.split('/')
        systolic, diastolic = int(systolic), int(diastolic)
        if not (50 <= systolic <= 300):
            errors.append(f'Systolic BP {systolic} out of range (50-300 mmHg)')
        if not (20 <= diastolic <= 200):
            errors.append(f'Diastolic BP {diastolic} out of range (20-200 mmHg)')
        if diastolic >= systolic:
            errors.append('Diastolic BP must be less than systolic BP')

    return (len(errors) == 0), errors


def validate_registration(data: dict) -> tuple:
    """
    Validate user registration data.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []

    # Required fields
    if not data.get('name') or len(str(data['name']).strip()) < 2:
        errors.append('Name must be at least 2 characters')

    # Email validation
    email = data.get('email', '')
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_pattern.match(email):
        errors.append('Invalid email format')

    # Password strength
    password = data.get('password', '')
    if len(password) < 6:
        errors.append('Password must be at least 6 characters')

    # Role
    role = data.get('role', '').lower()
    if role and role not in VALID_ROLES:
        errors.append(f'Invalid role. Must be one of: {", ".join(VALID_ROLES)}')

    return (len(errors) == 0), errors


def validate_login(data: dict) -> tuple:
    """
    Validate login request data.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []

    if not data.get('email'):
        errors.append('Email is required')
    if not data.get('password'):
        errors.append('Password is required')

    return (len(errors) == 0), errors
