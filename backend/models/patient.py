"""
============================================
Patient Model
============================================
Stores ICU patient vitals and demographic data.
Each record is linked to the user who created it.
"""

from datetime import datetime, timezone
from database import db


class Patient(db.Model):
    """ICU patient record with vital signs."""

    __tablename__ = 'patients'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patient_id = db.Column(
        db.String(50), unique=True, nullable=False, index=True
    )

    # Demographics
    age = db.Column(db.Integer, nullable=False)

    # Vital Signs
    heart_rate = db.Column(db.Float, nullable=False)          # bpm
    blood_pressure = db.Column(db.String(20), nullable=False)  # "120/80"
    spo2 = db.Column(db.Float, nullable=False)                 # percentage
    temperature = db.Column(db.Float, nullable=False)          # °C
    respiratory_rate = db.Column(db.Float, nullable=False)     # breaths/min

    # Audit fields
    created_by = db.Column(
        db.Integer, db.ForeignKey('users.id'), nullable=False
    )
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ───────────────────────────────────────────────
    predictions = db.relationship(
        'Prediction', backref='patient', lazy='dynamic',
        cascade='all, delete-orphan'
    )
    alerts = db.relationship(
        'Alert', backref='patient', lazy='dynamic',
        cascade='all, delete-orphan'
    )

    # ── Helpers ─────────────────────────────────────────────────────

    def parse_blood_pressure(self) -> tuple:
        """Parse blood_pressure string into (systolic, diastolic)."""
        try:
            parts = self.blood_pressure.split('/')
            return float(parts[0]), float(parts[1])
        except (IndexError, ValueError):
            return 120.0, 80.0  # safe default

    def to_dict(self) -> dict:
        """Return a JSON-safe dictionary representation."""
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'age': self.age,
            'heart_rate': self.heart_rate,
            'blood_pressure': self.blood_pressure,
            'spo2': self.spo2,
            'temperature': self.temperature,
            'respiratory_rate': self.respiratory_rate,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<Patient {self.patient_id}>'
