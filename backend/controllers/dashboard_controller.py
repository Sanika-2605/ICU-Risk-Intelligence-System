"""
============================================
Dashboard Controller
============================================
Handles HTTP request/response for role-specific
dashboard endpoints.
"""

from services.dashboard_service import (
    get_doctor_dashboard,
    get_nurse_dashboard,
    get_admin_dashboard,
)
from utils.response import success_response


def handle_doctor_dashboard(current_user=None):
    """
    GET /api/dashboard/doctor
    """
    data = get_doctor_dashboard()
    return success_response(
        'Doctor dashboard data retrieved successfully',
        data=data
    )


def handle_nurse_dashboard(current_user=None):
    """
    GET /api/dashboard/nurse
    """
    data = get_nurse_dashboard()
    return success_response(
        'Nurse dashboard data retrieved successfully',
        data=data
    )


def handle_admin_dashboard(current_user=None):
    """
    GET /api/dashboard/admin
    """
    data = get_admin_dashboard()
    return success_response(
        'Admin dashboard data retrieved successfully',
        data=data
    )
