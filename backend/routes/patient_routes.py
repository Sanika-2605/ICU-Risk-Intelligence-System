"""
============================================
Patient Routes
============================================
Blueprint: /api/patient
Protected — requires JWT + appropriate role.
"""

from flask import Blueprint
from middleware.auth import role_required
from controllers.patient_controller import (
    handle_add_patient,
    handle_update_patient,
    handle_get_all_patients,
    handle_get_patient,
)

patient_bp = Blueprint('patient', __name__, url_prefix='/api/patient')


@patient_bp.route('/add', methods=['POST'])
@role_required('doctor', 'nurse')
def add_patient(**kwargs):
    """Add a new patient with vitals. (Doctor, Nurse)"""
    return handle_add_patient(**kwargs)


@patient_bp.route('/update/<int:patient_id>', methods=['PUT'])
@role_required('doctor', 'nurse')
def update_patient(patient_id, **kwargs):
    """Update existing patient vitals. (Doctor, Nurse)"""
    return handle_update_patient(patient_id, **kwargs)


@patient_bp.route('/all', methods=['GET'])
@role_required('doctor', 'nurse', 'admin')
def get_all_patients(**kwargs):
    """List all patients. (Doctor, Nurse, Admin)"""
    return handle_get_all_patients(**kwargs)


@patient_bp.route('/<int:patient_id>', methods=['GET'])
@role_required('doctor', 'nurse', 'admin')
def get_patient(patient_id, **kwargs):
    """Retrieve a single patient. (Doctor, Nurse, Admin)"""
    return handle_get_patient(patient_id, **kwargs)
