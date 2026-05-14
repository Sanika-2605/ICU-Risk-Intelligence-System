"""
============================================
Patient Controller
============================================
Handles HTTP request/response for patient
CRUD endpoints.
"""

from flask import request
from services.patient_service import (
    add_patient, update_patient,
    get_all_patients, get_patient
)
from utils.response import success_response, error_response


def handle_add_patient(current_user=None):
    """
    POST /api/patient/add

    Body: { patient_id, age, heart_rate, blood_pressure,
            spo2, temperature, respiratory_rate }
    """
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    success, result = add_patient(data, current_user.id)

    if success:
        return success_response(
            'Patient added successfully',
            data=result,
            status_code=201
        )
    else:
        return error_response(result, 400)


def handle_update_patient(patient_id, current_user=None):
    """
    PUT /api/patient/update/<id>

    Body: { age?, heart_rate?, blood_pressure?,
            spo2?, temperature?, respiratory_rate? }
    """
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    success, result = update_patient(patient_id, data)

    if success:
        return success_response(
            'Patient updated successfully',
            data=result
        )
    else:
        return error_response(result, 404)


def handle_get_all_patients(current_user=None):
    """
    GET /api/patient/all
    """
    patients = get_all_patients()
    return success_response(
        'Patients retrieved successfully',
        data={'patients': patients, 'total': len(patients)}
    )


def handle_get_patient(patient_id, current_user=None):
    """
    GET /api/patient/<id>
    """
    patient = get_patient(patient_id)
    if patient:
        return success_response(
            'Patient retrieved successfully',
            data=patient
        )
    else:
        return error_response('Patient not found', 404)
