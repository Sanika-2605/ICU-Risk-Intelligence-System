"""
============================================
Alert Service
============================================
Business logic for creating and retrieving
clinical alerts.
"""

from database import db
from models.alert import Alert


def create_alert(patient_id: int, message: str, level: str = 'info') -> Alert:
    """
    Create and persist a clinical alert.

    Args:
        patient_id: FK to the Patient record
        message:    Human-readable alert description
        level:      info | warning | critical

    Returns:
        The created Alert ORM instance.
    """
    alert = Alert(
        patient_id=patient_id,
        alert_message=message,
        alert_level=level,
    )
    db.session.add(alert)
    # Caller is responsible for db.session.commit()
    return alert


def get_all_alerts() -> list:
    """Return all alerts, most recent first."""
    alerts = Alert.query.order_by(Alert.created_at.desc()).all()
    return [a.to_dict() for a in alerts]


def get_critical_alerts() -> list:
    """Return only critical-level alerts."""
    alerts = Alert.query.filter_by(
        alert_level='critical'
    ).order_by(Alert.created_at.desc()).all()
    return [a.to_dict() for a in alerts]


def get_alert_count() -> int:
    """Total number of alerts."""
    return Alert.query.count()


def get_recent_alerts(limit: int = 10) -> list:
    """Return the N most recent alerts."""
    alerts = Alert.query.order_by(
        Alert.created_at.desc()
    ).limit(limit).all()
    return [a.to_dict() for a in alerts]
