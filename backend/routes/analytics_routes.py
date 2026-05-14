"""
============================================
Analytics Routes
============================================
Blueprint: /api/analytics
Protected — Doctor and Admin only.
"""

from flask import Blueprint
from middleware.auth import role_required
from controllers.analytics_controller import (
    handle_risk_distribution,
    handle_patient_trends,
)

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@analytics_bp.route('/risk-distribution', methods=['GET'])
@role_required('doctor', 'admin')
def risk_distribution(**kwargs):
    """Risk category distribution analytics. (Doctor, Admin)"""
    return handle_risk_distribution(**kwargs)


@analytics_bp.route('/patient-trends', methods=['GET'])
@role_required('doctor', 'admin')
def patient_trends(**kwargs):
    """Patient admission and prediction trends. (Doctor, Admin)"""
    return handle_patient_trends(**kwargs)
