"""
============================================
Prediction Model
============================================
Stores ML risk predictions for ICU patients.
Includes risk score, risk level, feature importance,
and alert trigger status.
"""

import json
from datetime import datetime, timezone
from database import db


class Prediction(db.Model):
    """ML-generated risk prediction for a patient."""

    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey('patients.id'), nullable=False, index=True
    )

    risk_score = db.Column(db.Float, nullable=False)       # 0.0 – 1.0
    risk_level = db.Column(db.String(20), nullable=False)  # LOW / MEDIUM / HIGH
    feature_importance = db.Column(db.Text, nullable=True) # JSON string
    alert_status = db.Column(
        db.Boolean, default=False
    )  # True if alert was triggered

    timestamp = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # ── Helpers ─────────────────────────────────────────────────────

    def get_feature_importance(self) -> dict:
        """Deserialize feature_importance from JSON string."""
        if self.feature_importance:
            try:
                return json.loads(self.feature_importance)
            except json.JSONDecodeError:
                return {}
        return {}

    def set_feature_importance(self, importance: dict) -> None:
        """Serialize feature_importance to JSON string."""
        self.feature_importance = json.dumps(importance)

    def to_dict(self) -> dict:
        """Return a JSON-safe dictionary representation."""
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'risk_score': round(self.risk_score, 4),
            'risk_level': self.risk_level,
            'feature_importance': self.get_feature_importance(),
            'alert_status': self.alert_status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self) -> str:
        return f'<Prediction patient={self.patient_id} risk={self.risk_level}>'
