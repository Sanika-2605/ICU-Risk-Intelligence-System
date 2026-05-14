"""
============================================
Alert Model
============================================
Stores clinical alerts triggered by high-risk
ML predictions or vital sign anomalies.
"""

from datetime import datetime, timezone
from database import db


class Alert(db.Model):
    """Clinical alert associated with a patient."""

    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey('patients.id'), nullable=False, index=True
    )

    alert_message = db.Column(db.String(500), nullable=False)
    alert_level = db.Column(
        db.String(20), nullable=False, default='info'
    )  # info | warning | critical

    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # ── Serialization ───────────────────────────────────────────────

    def to_dict(self) -> dict:
        """Return a JSON-safe dictionary representation."""
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'alert_message': self.alert_message,
            'alert_level': self.alert_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f'<Alert patient={self.patient_id} level={self.alert_level}>'
