"""
============================================
Analytics Controller
============================================
Handles HTTP request/response for analytics
endpoints.
"""

from flask import request
from services.analytics_service import (
    get_risk_distribution,
    get_patient_trends,
)
from utils.response import success_response


def handle_risk_distribution(current_user=None):
    """
    GET /api/analytics/risk-distribution
    """
    data = get_risk_distribution()
    return success_response(
        'Risk distribution retrieved successfully',
        data=data
    )


def handle_patient_trends(current_user=None):
    """
    GET /api/analytics/patient-trends
    Optional query param: ?days=30
    """
    days = request.args.get('days', 30, type=int)
    days = min(max(days, 1), 365)  # clamp to 1-365

    data = get_patient_trends(days=days)
    return success_response(
        'Patient trends retrieved successfully',
        data=data
    )
