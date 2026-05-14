"""
============================================
Patient Service
============================================
Business logic for creating, updating, and
retrieving ICU patient records.
"""

from database import db
from models.patient import Patient
from utils.validators import validate_patient_data


def add_patient(data: dict, user_id: int) -> tuple:
    """
    Create a new patient record.

    Returns:
        (success: bool, result: dict | str)
    """
    # Validate
    is_valid, errors = validate_patient_data(data)
    if not is_valid:
        return False, '; '.join(errors)

    # Check duplicate patient_id
    if Patient.query.filter_by(patient_id=data['patient_id']).first():
        return False, f"Patient ID '{data['patient_id']}' already exists"

    patient = Patient(
        patient_id=str(data['patient_id']).strip(),
        age=int(data['age']),
        heart_rate=float(data['heart_rate']),
        blood_pressure=str(data['blood_pressure']).strip(),
        spo2=float(data['spo2']),
        temperature=float(data['temperature']),
        respiratory_rate=float(data['respiratory_rate']),
        created_by=user_id,
    )

    db.session.add(patient)
    db.session.commit()

    return True, patient.to_dict()


def update_patient(patient_id: int, data: dict) -> tuple:
    """
    Update an existing patient's vitals.

    Returns:
        (success: bool, result: dict | str)
    """
    patient = Patient.query.get(patient_id)
    if not patient:
        return False, 'Patient not found'

    # Partial update — only validate fields that are present
    updatable_fields = {
        'age', 'heart_rate', 'blood_pressure',
        'spo2', 'temperature', 'respiratory_rate'
    }

    for field in updatable_fields:
        if field in data and data[field] is not None:
            setattr(patient, field, data[field])

    db.session.commit()
    return True, patient.to_dict()


def get_all_patients() -> list:
    """Return all patients ordered by most recent."""
    patients = Patient.query.order_by(Patient.created_at.desc()).all()
    return [p.to_dict() for p in patients]


def get_patient(patient_id: int) -> dict | None:
    """Return a single patient by primary key."""
    patient = Patient.query.get(patient_id)
    return patient.to_dict() if patient else None


def get_patient_by_patient_id(patient_id_str: str):
    """Return the ORM object by the human-readable patient_id string."""
    return Patient.query.filter_by(patient_id=patient_id_str).first()


def get_total_patients() -> int:
    """Count of all patient records."""
    return Patient.query.count()
