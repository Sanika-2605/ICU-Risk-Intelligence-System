"""
============================================
Alert Controller
============================================
Handles HTTP request/response for alert
retrieval endpoints.
"""

from services.alert_service import get_all_alerts, get_critical_alerts
from utils.response import success_response


def handle_get_alerts(current_user=None):
    """
    GET /api/alerts
    """
    alerts = get_all_alerts()
    return success_response(
        'Alerts retrieved successfully',
        data={'alerts': alerts, 'total': len(alerts)}
    )


def handle_get_critical_alerts(current_user=None):
    """
    GET /api/alerts/critical
    """
    alerts = get_critical_alerts()
    return success_response(
        'Critical alerts retrieved successfully',
        data={'alerts': alerts, 'total': len(alerts)}
    )
