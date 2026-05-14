"""
============================================
Dashboard Routes
============================================
Blueprint: /api/dashboard
Each endpoint is restricted to its specific role.
"""

from flask import Blueprint
from middleware.auth import role_required
from controllers.dashboard_controller import (
    handle_doctor_dashboard,
    handle_nurse_dashboard,
    handle_admin_dashboard,
)

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/doctor', methods=['GET'])
@role_required('doctor')
def doctor_dashboard(**kwargs):
    """Doctor decision-support dashboard. (Doctor only)"""
    return handle_doctor_dashboard(**kwargs)


@dashboard_bp.route('/nurse', methods=['GET'])
@role_required('nurse')
def nurse_dashboard(**kwargs):
    """Nurse monitoring dashboard. (Nurse only)"""
    return handle_nurse_dashboard(**kwargs)


@dashboard_bp.route('/admin', methods=['GET'])
@role_required('admin')
def admin_dashboard(**kwargs):
    """Admin analytics dashboard. (Admin only)"""
    return handle_admin_dashboard(**kwargs)
