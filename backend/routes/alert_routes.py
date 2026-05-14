"""
============================================
Alert Routes
============================================
Blueprint: /api
Protected — requires JWT.
"""

from flask import Blueprint
from middleware.auth import role_required
from controllers.alert_controller import (
    handle_get_alerts,
    handle_get_critical_alerts,
)

alert_bp = Blueprint('alert', __name__, url_prefix='/api')


@alert_bp.route('/alerts', methods=['GET'])
@role_required('doctor', 'nurse', 'admin')
def get_alerts(**kwargs):
    """List all alerts. (Doctor, Nurse, Admin)"""
    return handle_get_alerts(**kwargs)


@alert_bp.route('/alerts/critical', methods=['GET'])
@role_required('doctor', 'admin')
def get_critical_alerts(**kwargs):
    """List critical alerts only. (Doctor, Admin)"""
    return handle_get_critical_alerts(**kwargs)
